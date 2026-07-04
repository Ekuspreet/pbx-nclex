# Endpoints

| endpoint | method | short desc |
| --- | --- | --- |
| `/api/health` | GET | Check API health and basic service availability. |
| `/api/config/public` | GET | Fetch public app settings such as trial limit, enabled auth providers, and support links. |
| `/api/auth/signup/otp` | POST | Send signup OTP to a new user's email address. |
| `/api/auth/signup/otp/resend` | POST | Resend signup OTP with expiry and resend-limit enforcement. |
| `/api/auth/signup/otp/verify` | POST | Verify signup OTP before account creation. |
| `/api/auth/signup` | POST | Create a new account after verified email OTP and start free trial access. |
| `/api/auth/login` | POST | Log in an existing user with email and password. |
| `/api/auth/logout` | POST | End the current user session. |
| `/api/auth/refresh` | POST | Refresh an authenticated session or access token. |
| `/api/auth/me` | GET | Fetch the currently authenticated user's profile and access state. |
| `/api/auth/google/start` | GET | Start Google sign-in flow. |
| `/api/auth/google/callback` | GET | Handle Google sign-in callback and create or log in the user. |
| `/api/auth/password/forgot` | POST | Start password reset flow for an email address. |
| `/api/auth/password/reset` | POST | Reset password using a valid reset token or OTP. |
| `/api/auth/email/verify` | POST | Verify account email when required after signup or email change. |
| `/api/auth/email/resend-verification` | POST | Resend email verification message with rate limits. |
| `/api/auth/account/delete-request` | POST | Submit an account or data deletion request. |
| `/api/users/me` | GET | Fetch user profile, trial status, subscription status, and referral summary. |
| `/api/users/me` | PATCH | Update user profile fields. |
| `/api/users/me/password` | PATCH | Change password for a logged-in user. |
| `/api/users/me/access` | GET | Fetch effective access rules for trial, paid plan, expired plan, notes, reviews, and explanations. |
| `/api/dashboard` | GET | Fetch dashboard overview for tests, feedback, notes, and subscription state. |
| `/api/trial/status` | GET | Fetch current user's free trial eligibility and remaining question allowance. |
| `/api/trial/start` | POST | Start or activate the user's free trial if eligible. |
| `/api/trial/validate` | POST | Validate trial access before generating or continuing trial tests. |
| `/api/subscription/plans` | GET | List active subscription plans with duration, price, renewal, cancellation, and upgrade rules. |
| `/api/subscription/current` | GET | Fetch current user's active, expired, canceled, or pending subscription. |
| `/api/subscription/checkout` | POST | Create a Stripe Checkout session for a selected subscription plan and optional referral code. |
| `/api/subscription/payment-intent` | POST | Create a Stripe Payment Intent when direct payment flow is used. |
| `/api/subscription/cancel` | POST | Cancel current user's subscription according to plan rules. |
| `/api/subscription/change-plan` | POST | Upgrade or downgrade the current subscription plan. |
| `/api/subscription/invoices` | GET | List user's payment invoices and subscription billing records. |
| `/api/payments/stripe/webhook` | POST | Receive Stripe lifecycle webhooks and grant or update access only after verified payment events. |
| `/api/payments/verify` | POST | Verify a payment or checkout session server-side before enabling subscription access. |
| `/api/payments/refunds/request` | POST | Submit a refund request for an eligible payment. |
| `/api/referrals/me` | GET | Fetch current user's referral code, reward balance, and referral history. |
| `/api/referrals/validate` | POST | Validate a referral code before checkout and return applicable discount details. |
| `/api/referrals/apply` | POST | Apply a referral code to a pending purchase. |
| `/api/referrals/rewards` | GET | List current user's referral rewards, approval state, and refund or reversal state. |
| `/api/referrals/payout-request` | POST | Request payout or credit usage for approved referral rewards. |
| `/api/questions` | GET | List questions with filters such as subject, topic, difficulty, type, tags, bookmarked, incorrect, or unused. |
| `/api/questions/:questionId` | GET | Fetch a single question with allowed user-facing fields. |
| `/api/questions/:questionId/bookmark` | POST | Bookmark a question for later review. |
| `/api/questions/:questionId/bookmark` | DELETE | Remove bookmark from a question. |
| `/api/questions/:questionId/feedback` | POST | Submit feedback or report an issue for a specific question. |
| `/api/questions/types` | GET | List supported NCLEX question types. |
| `/api/questions/subjects` | GET | List available subjects and configured NCLEX distribution percentages. |
| `/api/questions/topics` | GET | List topics, optionally filtered by subject. |
| `/api/questions/tags` | GET | List available question tags. |
| `/api/tests/config` | GET | Fetch test constraints such as min and max questions, time formula, allowed modes, and repeat rules. |
| `/api/tests/preview` | POST | Preview estimated test composition for selected question count, filters, and modes. |
| `/api/tests` | GET | List user's available, active, completed, and reviewable tests. |
| `/api/tests` | POST | Generate a new test using random balanced question selection and selected filters or modes. |
| `/api/tests/:testId` | GET | Fetch test JSON, current progress, timer state, questions, answers, notes, highlights, and statuses. |
| `/api/tests/:testId/start` | POST | Start a generated test and initialize timer state. |
| `/api/tests/:testId/resume` | POST | Resume an unfinished test with saved answers, position, and timer state. |
| `/api/tests/:testId/autosave` | PATCH | Autosave answers, notes, highlights, marked state, navigation state, and timer state. |
| `/api/tests/:testId/current-question` | PATCH | Update the current question position for resume behavior. |
| `/api/tests/:testId/answers` | PATCH | Save or update selected answer for one or more questions. |
| `/api/tests/:testId/questions/:questionId/check` | POST | Check an answer during Tutor Mode and return correctness plus explanation. |
| `/api/tests/:testId/questions/:questionId/status` | PATCH | Update question status such as answered, visited, unanswered, or marked for review. |
| `/api/tests/:testId/questions/:questionId/notes` | PATCH | Save sticky-note content for a question inside the test JSON. |
| `/api/tests/:testId/questions/:questionId/highlights` | PATCH | Save highlighted question content inside the test JSON. |
| `/api/tests/:testId/timer` | PATCH | Save timer state, including countdown, countup, paused explanation time, or resumed time. |
| `/api/tests/:testId/calculator/log` | POST | Optionally log calculator usage metadata during a test session. |
| `/api/tests/:testId/submit` | POST | Submit a test and calculate final result, counts, timing, and performance breakdowns. |
| `/api/tests/:testId/result` | GET | Fetch completed test summary including score, counts, time taken, and subject or topic performance. |
| `/api/tests/:testId/review` | GET | Fetch completed test review with selected answers, correct answers, explanations, notes, highlights, and feedback links. |
| `/api/tests/:testId/retry-incorrect` | POST | Create a new test from incorrect questions in a completed test. |
| `/api/tests/bookmarked/retry` | POST | Create a new test from bookmarked questions. |
| `/api/tests/difficult/retry` | POST | Create a new test from difficult questions based on prior performance or filters. |
| `/api/notes` | GET | List current user's saved notes across tests and questions. |
| `/api/notes/:noteId` | GET | Fetch a specific saved note with related test and question context. |
| `/api/notes/:noteId` | PATCH | Update a saved note from dashboard notes view. |
| `/api/notes/:noteId` | DELETE | Delete a saved note when allowed. |
| `/api/feedback` | GET | List current user's submitted question feedback and support status. |
| `/api/feedback/:feedbackId` | GET | Fetch feedback thread with replies, clarification, and linked question context. |
| `/api/feedback/:feedbackId/reply` | POST | Add a user reply or clarification to an existing feedback thread. |
| `/api/feedback/:feedbackId/close` | POST | Close or resolve a user feedback thread. |
| `/api/notifications` | GET | List in-app notifications such as payment, expiry, feedback reply, test summary, and referral updates. |
| `/api/notifications/:notificationId/read` | PATCH | Mark a notification as read. |
| `/api/notifications/read-all` | PATCH | Mark all current user's notifications as read. |
| `/api/support/contact` | POST | Submit a general contact or support request. |
| `/api/legal/terms` | GET | Fetch terms and conditions content. |
| `/api/legal/privacy` | GET | Fetch privacy policy content. |
| `/api/legal/refund` | GET | Fetch refund policy content. |
| `/api/legal/disclaimer` | GET | Fetch practice or preparation disclaimer content. |
| `/api/admin/auth/login` | POST | Log in an admin user. |
| `/api/admin/dashboard` | GET | Fetch admin overview for users, tests, subscriptions, payments, feedback, and reported questions. |
| `/api/admin/questions` | GET | List all questions for admin management with full filters and disabled records. |
| `/api/admin/questions` | POST | Create a new question with options, answer, explanation, metadata, media, tags, and type. |
| `/api/admin/questions/:questionId` | GET | Fetch full admin question detail including answer, explanation, feedback history, notes, and highlights metadata. |
| `/api/admin/questions/:questionId` | PATCH | Edit question content, answer, explanation, metadata, tags, type, difficulty, or media. |
| `/api/admin/questions/:questionId` | DELETE | Delete a question if allowed by data retention rules. |
| `/api/admin/questions/:questionId/disable` | PATCH | Disable a question without deleting it. |
| `/api/admin/questions/:questionId/enable` | PATCH | Re-enable a disabled question. |
| `/api/admin/questions/import` | POST | Bulk import questions and explanations from an uploaded file. |
| `/api/admin/questions/media` | POST | Upload media for question images, hotspot assets, case studies, or explanations. |
| `/api/admin/question-types` | GET | List and manage supported question type definitions. |
| `/api/admin/subjects` | GET | List subjects and NCLEX percentage distribution settings. |
| `/api/admin/subjects` | POST | Create a subject. |
| `/api/admin/subjects/:subjectId` | PATCH | Update subject name or distribution percentage. |
| `/api/admin/topics` | GET | List topics for admin management. |
| `/api/admin/topics` | POST | Create a topic under a subject. |
| `/api/admin/topics/:topicId` | PATCH | Update topic details. |
| `/api/admin/tags` | GET | List tags for admin management. |
| `/api/admin/tags` | POST | Create a question tag. |
| `/api/admin/tags/:tagId` | PATCH | Update a question tag. |
| `/api/admin/feedback` | GET | List all question feedback and reports with status filters. |
| `/api/admin/feedback/:feedbackId` | GET | Fetch feedback detail with user, question, test, and thread context. |
| `/api/admin/feedback/:feedbackId/reply` | POST | Reply to user feedback and trigger feedback reply notification. |
| `/api/admin/feedback/:feedbackId/status` | PATCH | Update feedback status such as pending, reviewing, resolved, or closed. |
| `/api/admin/users` | GET | List users with access, trial, subscription, referral, and abuse-risk filters. |
| `/api/admin/users/:userId` | GET | Fetch admin user detail with profile, tests, notes, feedback, payments, and access state. |
| `/api/admin/users/:userId` | PATCH | Update user account fields or administrative flags. |
| `/api/admin/users/:userId/disable` | PATCH | Disable a user account. |
| `/api/admin/users/:userId/enable` | PATCH | Re-enable a disabled user account. |
| `/api/admin/users/:userId/access` | PATCH | Override or adjust a user's access state when needed. |
| `/api/admin/subscriptions` | GET | List subscriptions with plan, status, renewal, expiry, cancellation, and payment filters. |
| `/api/admin/subscriptions/:subscriptionId` | GET | Fetch subscription detail with user and payment history. |
| `/api/admin/subscriptions/:subscriptionId` | PATCH | Update administrative subscription status or metadata. |
| `/api/admin/plans` | GET | List subscription plans for admin management. |
| `/api/admin/plans` | POST | Create a subscription plan. |
| `/api/admin/plans/:planId` | PATCH | Update plan duration, price, renewal, cancellation, upgrade, or downgrade behavior. |
| `/api/admin/plans/:planId/disable` | PATCH | Disable a subscription plan from new purchases. |
| `/api/admin/payments` | GET | List payments, refunds, and failed payment records. |
| `/api/admin/payments/:paymentId` | GET | Fetch payment detail with Stripe metadata and access-grant history. |
| `/api/admin/payments/:paymentId/refund` | POST | Create or record a refund and adjust subscription or referral reward state. |
| `/api/admin/referrals` | GET | List referral codes, buyers, rewards, approvals, reversals, and self-referral flags. |
| `/api/admin/referrals/:referralId` | GET | Fetch referral detail with payment and reward context. |
| `/api/admin/referrals/:referralId/status` | PATCH | Approve, reject, reverse, or mark a referral reward as paid. |
| `/api/admin/reports/questions` | GET | List reported questions requiring content review. |
| `/api/admin/reports/questions/:questionId/fix` | PATCH | Mark a reported question as fixed after content correction. |
| `/api/admin/notifications/send` | POST | Send manual user notification for support, payment, subscription, or referral events. |
| `/api/admin/legal/:pageKey` | GET | Fetch editable legal or trust page content. |
| `/api/admin/legal/:pageKey` | PATCH | Update legal or trust page content. |
