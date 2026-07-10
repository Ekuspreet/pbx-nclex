# Authentication

## Architecture

The server uses Express, PostgreSQL, Drizzle ORM, and secure `httpOnly` cookies.

- Access tokens are short-lived JWTs stored in the access cookie.
- Refresh tokens are long-lived JWTs stored in the refresh cookie.
- Refresh tokens are hashed before storage in `refresh_sessions`.
- Refresh tokens rotate on every refresh.
- Reuse of a revoked refresh token revokes the token family.
- Passwords are hashed with Argon2id.
- Email verification OTPs are generated with `crypto.randomInt`, hashed at rest, expire, and are one-time use.
- Password reset tokens are random, hashed at rest, expire, and are one-time use.
- Google Sign-In uses Google Identity Services on the client and `google-auth-library` verification on the server.
- Browser code never receives JWTs in JSON and does not store tokens in `localStorage`.

## Environment

Create `server/.env` from `server/.env.example` and `client/.env` from `client/.env.example`.
The learner UI and admin UI are served by the same client app origin; admin lives under `/admin/...`, so `CLIENT_URL` is the only browser origin the server needs to trust.

Generate different token secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Required local backend values include:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pbx_nursing
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
GOOGLE_CLIENT_ID=
EMAIL_PROVIDER=console
```

Required local frontend values:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=
```

Do not expose backend secrets through Vite variables.

## Database

Auth schema files live in `server/models/`:

- `user.js`
- `emailVerification.js`
- `refreshSession.js`
- `passwordReset.js`

No migration has been applied by this implementation pass.

When ready to create and review a migration:

```bash
cd server
npm run db:generate
```

Inspect the generated SQL in `server/db/migrations/`.

When ready to apply it:

```bash
cd server
npm run db:migrate
```

Do not run generated migrations against a database that already has unmanaged tables without reviewing the SQL first. If your database already has `questions`, the first generated migration may include it as part of the baseline because it is exported from `models/index.js`.

## Google Setup

In Google Cloud Console:

1. Create or select a project.
2. Configure the OAuth consent screen.
3. Create a Web application OAuth client.
4. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - the exact production frontend origin later
5. Copy the client ID to both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

No Google client secret is needed for the selected credential verification flow.

## Email Setup

Local development uses:

```env
EMAIL_PROVIDER=console
```

This logs development OTP/reset emails to the server console and does not send real email.

Production uses Gmail SMTP through Nodemailer OAuth2:

```env
EMAIL_PROVIDER=gmail
GOOGLE_MAIL_USER=your-sender@gmail.com
GOOGLE_MAIL_CLIENT_ID=
GOOGLE_MAIL_CLIENT_SECRET=
GOOGLE_MAIL_REFRESH_TOKEN=
EMAIL_FROM=your-sender@gmail.com
EMAIL_FROM_NAME=PBX Nursing
```

`EMAIL_FROM` can be the same mailbox as `GOOGLE_MAIL_USER` or a Gmail send-as alias configured for that account. If `EMAIL_FROM` is omitted, the app sends from `GOOGLE_MAIL_USER`.

To generate the Gmail OAuth values:

1. In Google Cloud Console, create or select a project.
2. Configure the OAuth consent screen. If the app is in testing mode, add the sender mailbox as a test user.
3. Enable the Gmail API for the project.
4. Create an OAuth client ID. A Web application client works well with OAuth 2.0 Playground.
5. If using OAuth 2.0 Playground, add `https://developers.google.com/oauthplayground` as an authorized redirect URI on that OAuth client.
6. Copy the OAuth client ID into `GOOGLE_MAIL_CLIENT_ID` and the OAuth client secret into `GOOGLE_MAIL_CLIENT_SECRET`.
7. Open OAuth 2.0 Playground, enable "Use your own OAuth credentials" in settings, and paste the same client ID and secret.
8. Authorize the mailbox with the `https://mail.google.com/` scope.
9. Exchange the authorization code for tokens and copy the refresh token into `GOOGLE_MAIL_REFRESH_TOKEN`.
10. Set `GOOGLE_MAIL_USER` to the Gmail or Google Workspace address that authorized the scope.

Do not use a normal personal mailbox password.

## API Endpoints

All endpoints are under `/api/v1`.

- `POST /auth/signup`
- `POST /auth/verify-email`
- `POST /auth/resend-otp`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Local Test Flow

1. Apply the reviewed Drizzle migration.
2. Start the backend:

```bash
cd server
npm run dev
```

3. Start the frontend:

```bash
cd client
npm run dev
```

4. Visit `http://localhost:5173/signup`.
5. Submit signup.
6. Read the development OTP from the server console.
7. Verify email.
8. Log in.
9. Confirm `/home` loads.
10. Refresh the browser and confirm the session restores.
11. Test logout.
12. Test forgot/reset password using the console reset link.
13. Test Google Sign-In after setting up Google Cloud credentials.

## Production Notes

- Set `COOKIE_SECURE=true` behind HTTPS.
- Use `COOKIE_SAME_SITE=lax` for same-site deployments.
- Use `COOKIE_SAME_SITE=none` only for cross-site deployments and only with secure cookies.
- Restrict `CLIENT_URL` to known origins.
- Keep `credentials: true` in CORS only for trusted origins.
- Do not log passwords, OTPs, reset tokens, refresh tokens, or JWTs in production.
- Add an external cleanup job for expired email verifications, expired password resets, and old revoked refresh sessions.
