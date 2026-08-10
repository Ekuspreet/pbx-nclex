# PBX NCLEX Security Audit Report

**Assessment date:** 2026-08-10  
**Scope:** Entire repository: React client, Express API, authentication and sessions, admin functions, payments, PostgreSQL access, question/test lifecycle, static question resources, Nginx, Podman Compose, container definitions, and npm dependency trees.  
**Method:** Manual source review, authorization/data-flow tracing, secret and dangerous-API searches, syntax/build checks, and `npm audit` against the live npm advisory registry.

## Executive summary

The application has strong foundations in several areas: parameterized Drizzle queries, Argon2id password hashing, hashed and rotating refresh tokens, strict JWT algorithms, HttpOnly cookies, ownership checks on most user records, Google ID-token verification, Razorpay signature verification, webhook idempotency, and HTML sanitization for question content.

However, the assessment identified one critical application vulnerability, two high-severity authorization/business-control failures, seven medium-severity weaknesses, and two currently installed dependency advisory chains. The most urgent issue is that correct answers are returned to the browser before a learner submits an answer.

| Severity | Confirmed findings |
|---|---:|
| Critical | 1 |
| High | 3 |
| Medium | 8 |
| Low | 3 |
| Informational | 3 |

No claim is made that this is a formal penetration test or an exhaustive proof of absence. Dynamic attacks against a deployed instance, cloud/IAM review, database contents, TLS termination, host configuration, container image CVE scanning, and Razorpay/Google tenant configuration were not available in this source-only assessment.

## Immediate remediation order

1. Stop returning answer keys and `isCorrect` flags before server-authorized checking/submission.
2. Enforce plan/question access centrally on every endpoint that can return question content, including old tests, notes, highlights, feedback, results, and reviews.
3. Upgrade `react-router-dom` and refresh the lockfile.
4. Add CSRF/origin enforcement to cookie-authenticated mutations.
5. Add application-wide abuse limits and transactional enforcement of plan quotas.
6. Harden the admin authentication model and production HTTP headers.

## Detailed findings

### SEC-001 — Correct answers disclosed before submission

**Severity:** Critical  
**Class:** CWE-200 (Exposure of Sensitive Information), CWE-602 (Client-Side Enforcement of Server-Side Security)  
**CVE:** Not applicable; this is an application-specific vulnerability.

`toClientQuestion()` adds the complete `correctAnswer` and an `isCorrect` boolean to every answer choice. `getTestPayload()` uses this representation for an in-progress test, and test creation returns that payload immediately.

**Evidence:**

- `server/services/questionBankService.js`: `toClientQuestion()`, especially the `isCorrect` and `correctAnswer` fields.
- `server/services/testService.js`: `combineQuestionState()`, `getTestPayload()`, and the return from `createTest()`.

**Impact:** Any authenticated learner can open browser developer tools or call the API and obtain the answer to every question before answering. This defeats exam integrity and paid content value.

**Remediation:** Create separate serializers for unanswered, tutor-checked, and submitted/review states. The unanswered serializer must omit `correctAnswer`, `isCorrect`, explanations, scoring guides, and any other answer-bearing metadata. Only the server should score answers. Add response-contract tests proving that answer-bearing fields are absent until authorized.

### SEC-002 — Free-tier question restriction can be bypassed through related-resource APIs

**Severity:** High  
**Class:** CWE-862 (Missing Authorization), CWE-639 (Authorization Bypass Through User-Controlled Key)  
**CVE:** Not applicable.

Free-tier filtering is applied during new test creation and dashboard generation, but note, highlight, and feedback creation accepts a caller-provided internal question UUID. When `testId` is omitted, these services only verify that the question exists (or rely on the foreign key), not that the user or plan may access it. Their response attachment then serializes the full question—including SEC-001 answer data.

**Evidence:**

- `server/services/noteService.js`: `createNote()` and `attachQuestionContext()`.
- `server/services/highlightService.js`: `createHighlight()`, `replaceQuestionHighlights()`, and `attachQuestionContext()`.
- `server/services/feedbackService.js`: `assertFeedbackContextBelongsToUser()` permits any existing question when no test is supplied; `attachFeedbackContext()` returns the question.

**Exploit condition:** The attacker needs a non-trial internal question UUID. Such IDs can remain available from prior tests/subscriptions, logs, shared links, or another disclosure.

**Remediation:** Introduce one central `authorizeQuestionAccess(userId, plan, questionUuid, optionalTestId)` function and call it before every question lookup/serialization. If a `testId` is supplied, require a matching `test_questions` row owned by the user. If absent, enforce the current plan allowlist. Never attach full question objects when a title/number is sufficient.

### SEC-003 — Downgraded/free users retain full access through previously created tests

**Severity:** High  
**Class:** CWE-862 (Missing Authorization)  
**CVE:** Not applicable.

Plan restrictions are checked when a test is created, but read, result, review, answer, status, timer, and submit endpoints do not receive or enforce the current user plan. A user who created Plus tests and later becomes Free can continue retrieving and interacting with all questions in those tests.

**Evidence:**

- `server/controllers/testController.js`: only `create()` passes `req.user.plan`; `show()`, `result()`, `answer()`, `status()`, `submit()`, and `timer()` do not.
- `server/services/testService.js`: `getTestPayload()` and `getTestResult()` authorize ownership but not current plan/question entitlement.

**Impact:** Paid question content remains accessible after subscription expiry and violates the new rule that Free users may access only the fixed trial questions.

**Remediation:** Define the intended entitlement policy explicitly. If expiry must revoke non-trial access, enforce the current plan on every test/question read and mutation. Consider preserving aggregate historical scores while redacting inaccessible question content.

### DEP-001 — React Router RSC CSRF advisory in installed dependency

**Severity:** High according to `npm audit`; practical applicability is low for the current BrowserRouter SPA  
**Identifier:** GHSA-qwww-vcr4-c8h2 (no CVE assigned as of assessment)  
**Affected installed range:** `react-router` / `react-router-dom` 7.18.1; affected `>=7.12.0 <7.18.2`  
**Patched:** 7.18.2

The advisory affects unstable React Server Component APIs. This repository uses `BrowserRouter` and no RSC APIs were found, so the vulnerable code path does not appear reachable. The package remains inside the advisory range and should still be upgraded. See the [official React Router advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2).

**Remediation:** Upgrade `react-router-dom` to at least 7.18.2, regenerate `client/package-lock.json`, build, and rerun `npm audit`.

### SEC-004 — No explicit CSRF/origin validation for cookie-authenticated mutations

**Severity:** Medium  
**Class:** CWE-352 (Cross-Site Request Forgery)  
**CVE:** Not applicable.

Authentication uses cookies and state-changing endpoints rely on `SameSite` plus CORS, but no CSRF token or `Origin`/`Referer` validation exists. CORS is not a CSRF control. The default `SameSite=Lax` blocks many conventional cross-site POST attacks, but protection weakens if production uses `SameSite=None`, a broad `COOKIE_DOMAIN`, a compromised sibling subdomain, or browser edge cases.

**Evidence:**

- `server/server.js`: CORS configuration but no origin-verification middleware.
- `server/utils/auth/cookie.js` and `server/services/adminAuthService.js`: cookie configuration.
- All state-changing auth, test, note, highlight, feedback, payment, and admin routes.

**Remediation:** Reject unsafe-method requests whose `Origin` is absent or not exactly trusted, and add a synchronizer/double-submit CSRF token where cross-site cookie use is required. Prefer host-only cookies and `SameSite=Strict` where UX permits.

### SEC-005 — Shared static administrator credential and non-revocable 12-hour token

**Severity:** Medium  
**Class:** CWE-798/CWE-259 family (Static/Hard-Coded Credential Model), CWE-613 (Insufficient Session Expiration)  
**CVE:** Not applicable.

The application has one environment-defined administrator username/password, defaults the username to `admin`, and issues a stateless token lasting up to 12 hours. There is no per-admin identity, password hash record, MFA, session inventory, token ID, revocation, privilege separation, or audit trail. Logout only clears the browser cookie and cannot revoke a stolen token.

**Evidence:** `server/services/adminAuthService.js`, `server/env/index.js`, and `server/controllers/adminController.js`.

**Remediation:** Store individual admin accounts with Argon2id hashes; require MFA; issue short-lived tokens backed by revocable server sessions; record security audit events; rotate credentials; and remove the known default username.

### SEC-006 — Plan quota checks are raceable

**Severity:** Medium  
**Class:** CWE-362 (Concurrent Execution Using Shared Resource with Improper Synchronization)  
**CVE:** Not applicable.

Free note/highlight limits use `COUNT(*)` followed by a separate insert. Concurrent requests can all observe a count below the limit and then insert, exceeding the quota. `replaceQuestionHighlights()` uses a transaction but does not lock a per-user quota row, so it remains susceptible to concurrent transactions under the default isolation level.

**Evidence:** `server/services/noteService.js:createNote()`, `server/services/highlightService.js:createHighlight()`, and `replaceQuestionHighlights()`.

**Remediation:** Enforce quotas with a serialized per-user lock/counter, an advisory lock, or a schema-level design that makes the limit atomic. Add concurrency tests.

### SEC-007 — Insufficient abuse controls on expensive and write-heavy endpoints

**Severity:** Medium  
**Class:** CWE-400 (Uncontrolled Resource Consumption)  
**CVE:** Not applicable.

Rate limits exist for authentication and payment operations, but not for test creation, dashboard generation, feedback/replies, notes, highlights, test writes, or admin data reads. Test creation and dashboard generation currently load the complete question table into application memory; context attachment also performs N+1 database queries.

**Evidence:** `server/middleware/rateLimits.js`, `server/routes/*.js`, `server/services/testService.js`, note/highlight/feedback attachment functions.

**Impact:** An authenticated account can create database load, storage growth, or message spam and degrade service for other users.

**Remediation:** Add user-aware and IP-aware limits, endpoint-specific quotas, pagination, bulk joins, maximum active tests, and database-side filtering rather than loading the full bank.

### SEC-008 — Production frontend lacks explicit browser security headers

**Severity:** Medium  
**Class:** CWE-693 (Protection Mechanism Failure)  
**CVE:** Not applicable.

Helmet protects Express responses, but the SPA is served directly by Nginx and `nginx.conf` does not set a Content Security Policy, HSTS, frame-ancestors/X-Frame-Options, Referrer-Policy, Permissions-Policy, or `X-Content-Type-Options`. The client integrates Google and Razorpay, so CSP rollout requires an explicit tested allowlist.

**Evidence:** `nginx.conf`; `server/server.js` only applies Helmet to Express.

**Remediation:** Add headers at the outermost TLS-serving proxy. Start CSP in report-only mode, remove unnecessary third-party origins, then enforce it. Only enable HSTS after HTTPS is correctly deployed everywhere.

### SEC-009 — Reset credential remains in URL and is rendered in a normal text field

**Severity:** Medium  
**Class:** CWE-598 (Sensitive Information in Query Strings), CWE-359 (Exposure of Private Information)  
**CVE:** Not applicable.

Password reset tokens are delivered in the query string, retained in browser history/address UI, stored in component state, and shown in a normal visible text input. Query tokens can leak through screenshots, copied URLs, browser history/sync, monitoring, or improperly configured proxy logs.

**Evidence:** `server/services/authService.js:buildPasswordResetUrl()` and `client/src/pages/auth/ResetPasswordPage.jsx`.

**Remediation:** On initial load, move the token into short-lived state and immediately remove it from the address bar with `history.replaceState`. Do not render it in a visible input. Apply `Referrer-Policy: no-referrer` to the reset page and ensure proxies redact query strings.

### DEP-002 — Vulnerable esbuild development server in Drizzle Kit chain

**Severity:** Moderate, development-only in this repository  
**Identifier:** GHSA-67mh-4wv8-2f99 (no CVE assigned)  
**Affected:** esbuild `<=0.24.2`; patched in 0.25.0

The vulnerable esbuild is transitive through `drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils`. It permits a malicious website to read content from an exposed esbuild development server. Drizzle Kit is a development dependency and is omitted from the production server image, substantially reducing production exposure. See the [GitHub Advisory Database entry](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

**Remediation:** Do not expose development servers to untrusted networks. Track a Drizzle Kit release that removes the old loader/esbuild chain. `npm audit fix` currently proposes a misleading major downgrade to Drizzle Kit 0.18.1; do not apply it blindly.

### SEC-010 — Floating container base images and no container CVE gate

**Severity:** Medium  
**Class:** CWE-1104 (Use of Unmaintained Third-Party Components) / supply-chain hardening  
**CVE:** Specific OS CVEs were not determinable without scanning the built images.

Images use mutable tags such as `node:22-bookworm-slim` and `postgres:16-alpine`, without digest pinning or a documented image-vulnerability scan. A rebuild can therefore produce materially different software without a source change.

**Evidence:** `server/Containerfile`, `client/Containerfile`, and `podman-compose.yaml`.

**Remediation:** Pin reviewed image digests, automate Renovate/Dependabot updates, generate an SBOM, and gate releases with Trivy/Grype or an equivalent image scanner.

### SEC-011 — Password and login policy remains weak against distributed guessing

**Severity:** Low  
**Class:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-521 (Weak Password Requirements)  
**CVE:** Not applicable.

User passwords require only eight characters with a letter and digit. Login limiting is in-process and IP-based; distributed attacks or process restarts weaken it. The admin limiter has the same architecture.

**Positive controls:** Unknown-user password verification uses a dummy Argon2 hash to reduce timing enumeration, error messages are generic, and Argon2id parameters are reasonable.

**Remediation:** Prefer minimum length 12+, permit password managers/passphrases, reject known-compromised passwords, use a shared rate-limit store, add per-account progressive delay, and alert on anomalous authentication.

### SEC-012 — Public question assets and exhibits are unauthenticated

**Severity:** Low  
**Class:** CWE-200 (Exposure of Sensitive Information), depending on content classification  
**CVE:** Not applicable.

Everything under `server/public` is served without authentication. If exhibits/images are licensed or part of paid material, anyone who obtains a filename can retrieve them independently of plan restrictions.

**Evidence:** `server/server.js` mounts `express.static` before authenticated API routes; Nginx proxies `/public/` directly.

**Remediation:** Decide whether these resources are truly public. If protected, serve them through an authorization-aware route or short-lived signed URLs. Avoid relying on unguessable filenames as access control.

### SEC-013 — Legacy email-verification endpoints remain exposed after Google-only signup

**Severity:** Low  
**Class:** CWE-1059 (Incomplete Removal of Feature) / unnecessary attack surface  
**CVE:** Not applicable.

Email/password signup routing was removed, but `/auth/verify-email` and `/auth/resend-otp` and their service code remain publicly available. They do not appear to create new users, but keeping unreachable legacy workflows expands maintenance and abuse surface.

**Remediation:** Remove legacy endpoints, validators, rate limits, OTP/email-verification services, and database tables after confirming no migration dependency remains.

## Informational observations

### INFO-001 — No automated server/security test suite

No server test command or authorization regression suite is defined. High-risk invariants such as ownership, plan enforcement, answer redaction, refresh rotation, CSRF rejection, and payment idempotency are not automatically protected.

### INFO-002 — Source resource set is incomplete

The question JSON references three missing assets and 22 missing exhibit files. This is primarily an availability/content-integrity defect rather than a security vulnerability, but repeated missing-resource requests can add avoidable load.

### INFO-003 — Application listens over plaintext HTTP inside the provided topology

The included Nginx listens on port 80 and publishes port 8080. This can be acceptable behind a correctly configured TLS reverse proxy, but that outer layer is not present in the repository and could not be verified. Production cookies and environment validation require HTTPS, which is positive.

## Positive security controls confirmed

- Drizzle ORM parameterization is consistently used; no direct user-controlled SQL string concatenation was found.
- Passwords use Argon2id; password hashes are never returned by `toPublicUser()`.
- Access and refresh JWT verification restricts algorithms to HS256 and enforces token type.
- Refresh tokens are HMAC-hashed at rest, rotate, and support family revocation on reuse.
- Password-reset tokens are random, hashed, expiring, one-time use, and revoke refresh sessions after reset.
- Authentication cookies are HttpOnly; production requires Secure cookies and HTTPS client origin.
- CORS uses an exact configured client origin with credentials rather than a wildcard.
- Google credentials are verified server-side for audience and verified email.
- Razorpay browser signatures and webhook signatures use HMAC and timing-safe comparison.
- Payment amount, currency, capture status, order relationship, user relationship, and webhook idempotency are validated.
- Most test, note, highlight, and feedback record operations include user ownership predicates.
- Question/reference HTML passes through DOMPurify; exhibit HTML is displayed in an iframe with an empty sandbox permission set.
- The server container drops root and runs as the `node` user.

## Dependency scan summary

### Client

`npm audit` reported 2 vulnerable package entries representing one advisory chain:

- 2 high: `react-router-dom` -> `react-router` -> GHSA-qwww-vcr4-c8h2.
- 0 critical, 0 moderate, 0 low.

The same advisory remains present with `npm audit --omit=dev`, because React Router is a production dependency.

### Server

`npm audit` reported 4 moderate package entries representing one transitive advisory chain:

- `drizzle-kit` -> `@esbuild-kit/esm-loader` -> `@esbuild-kit/core-utils` -> vulnerable `esbuild`.
- 0 critical, 0 high, 0 low.

`npm audit --omit=dev` reported zero server production dependency vulnerabilities, confirming this chain is excluded from the production install.

Counts are package-node counts, not four independent vulnerabilities.

## Recommended verification after fixes

1. Add integration tests that inspect raw JSON for an unsubmitted test and fail if any answer key leaks.
2. Test every question-bearing endpoint as Free, expired Plus, active Plus, and another user.
3. Run concurrent quota tests for notes/highlights.
4. Add CSRF tests for missing, foreign, null, and same-site-subdomain origins.
5. Run `npm audit`, an SBOM scan, secret scan, SAST, DAST, and container image scan in CI.
6. Perform a staging penetration test with two learner accounts, one admin, a downgraded subscription, and Razorpay test mode.
7. Re-run this audit after remediation; security findings should be closed only with executable regression tests.
