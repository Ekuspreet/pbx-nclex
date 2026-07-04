# Feature Ideation

## Front Interface

The app should open with a clear, simple front interface that guides users into signing in, starting a free trial, purchasing a subscription, or returning to an active test.

## Sign In

The authentication flow should separate login from signup clearly.

Existing users should log in with email and password.

New users should sign up with an email-based OTP verification flow. After the OTP is verified, the user can create their account and receive access to the free trial.

Users should also be able to continue with Google sign-in as an alternate authentication option.

The sign-in flow should be quick and reliable, especially for first-time users who want to begin the free trial immediately.

The authentication system should also include password reset, email verification, OTP expiry, OTP resend limits, and login rate limits to prevent abuse.

## Free Trial

After signing in, every new user should receive a free trial with access to 70 questions. The trial should let users experience the real test interface, including question navigation, notes, highlighting, and the selected test mode.

The system should prevent users from creating repeated free trials through duplicate accounts, repeated emails, or other abuse patterns.

## User Dashboard

After login, users should land on a dashboard that gives them quick access to their study activity and saved work.

The dashboard should contain three main heads:

- Tests
- Feedback
- Notes

### Tests

The Tests section should show the user's available, active, and completed tests. Users should be able to start a new test, continue an unfinished test, and review completed test history from this area.

### Feedback

The Feedback section should show all question feedback submitted by the user. It should help users track reported issues, replies, clarifications, and any pending concerns related to specific questions.

### Notes

The Notes section should collect the user's saved question notes in one place. Users should be able to review notes by question or test so their study points remain easy to find after a test session.

## Subscription Access Rules

The app should clearly define what free users and paid users can access.

Free users should have access to the free trial question limit. Paid users should have access based on their active subscription plan.

The system should define what happens when a subscription expires, including whether users can still view completed test history, notes, feedback, and explanations from previous tests.

Subscription plans should define duration, price, renewal behavior, cancellation behavior, and whether users can upgrade or downgrade plans.

## Payment, Subscription, and Referrals

Users should be able to purchase a subscription after the free trial or whenever they choose to upgrade.

Stripe should be the primary payment processor for subscriptions, with Stripe Checkout or Payment Intents handling card payments, subscription lifecycle events, refunds, and webhook-based payment confirmation before access is granted.

Referral codes should apply a 15% discount to the paying user. The person who shared the referral code should receive a 15% referral refund or reward after the payment is completed.

Payment verification should happen through the backend so subscription access is granted only after confirmed payment success.

Referral rules should define whether the reward is cash, wallet credit, or discount credit. The system should also define when referral rewards are approved, whether rewards apply only to the first purchase, what happens if the buyer requests a refund, and how self-referrals are prevented.

## Question Selection

The question selection window should let users choose how many questions they want in a test.

When the test is generated, questions should be selected randomly while still following the NCLEX paper subject percentage distribution. This ensures each test feels fresh but remains balanced and exam-relevant.

Users should be able to create custom tests based on available filters such as subject, topic, difficulty, incorrect questions, bookmarked questions, or unused questions.

The system should define the minimum and maximum number of questions allowed in a test, and whether repeated questions are allowed across different tests.

## Question Bank Structure

Each question should have a consistent data structure so it can be tested, reviewed, filtered, and maintained properly.

Question data should include:

- Question text
- Question type
- Subject
- Topic
- Difficulty
- Options
- Correct answer
- Explanation
- Tags
- Images or media, if needed
- Notes
- Highlights
- Feedback history

The question bank should support the question types needed for NCLEX-style practice, such as single choice, multiple response, ordered response, fill-in, hotspot, case study, or other formats required later.

## Test Modes

The test setup should include two mode switches:

- Tutor Mode: yes/no
- Timed Mode: yes/no

### Tutor Mode

When Tutor Mode is enabled, the user should see a `Check` button. After pressing `Check`, the explanation for that question should appear.

When Tutor Mode is disabled, the explanation should not appear during the test, and the `Check` button should not be shown.

### Timed Mode

When Timed Mode is enabled, the test should start a countdown timer.

The total test time should be calculated as:

```text
124,000 milliseconds * number of selected questions
```

If Tutor Mode is also enabled, the timer should pause while the user is reading the explanation. The timer should resume only after the user presses `Next`.


If timer mode is disabled, user should see a countup timer to track the time he took to attempt.

## Question Status and Navigation

During a test, each question should have a clear status so users can track their progress.

Question statuses should include:

- Current question
- Answered
- Not answered
- Visited but unanswered
- Marked for review

The test console should include a question navigation area where users can jump between questions, identify incomplete questions, and return to marked questions before submitting the test.

## Save and Resume Behavior

The system should save test progress automatically.

Answers, notes, highlights, marked questions, current question position, and timer state should be saved regularly so users do not lose progress if the browser closes or the internet disconnects.

The app should define whether timed tests can be paused and resumed later, and whether the timer continues or stops when the user exits the test.

## Calculator

The test console should include an NCLEX-style calculator. The calculator should match the NCLEX calculator closely enough that users feel comfortable with the tool during practice.

## Feedback and Question Support

Each question should include a feedback option linked directly to client feedback or support chat.

This should allow users to report concerns about a specific question, and allow the team to respond, clarify, or review the issue in context.

## Test Data and Highlights

Every generated test should have its own JSON data.

When a user highlights text in a question, that highlighted content should be saved in the test JSON under `highlights`. When the user returns to the question, the same text should automatically appear highlighted again.

## Notes

Each question already includes a `notes` field in the question data.

The test console should connect this field to a notes button. When the user opens notes, a sticky-note style editor should appear. Anything typed there should be saved automatically into the question's `notes` field and restored when the user returns to that question.

## Test Result and Review

After a test is submitted, users should see a clear result summary.

The result screen should include:

- Final score
- Correct count
- Incorrect count
- Unanswered count
- Time taken
- Subject-wise performance
- Topic-wise performance, if available

Users should be able to review completed tests question by question. The review should show the selected answer, correct answer, explanation, notes, highlights, and feedback option.

Users should also be able to retry incorrect questions, revisit bookmarked questions, and review difficult questions for continued practice.

## Admin Panel

The platform should include an admin panel for managing the learning content and user support workflow.

Admins should be able to:

- Add, edit, disable, and delete questions
- Upload explanations and media
- Assign subjects, topics, difficulty, tags, and question types
- Review user feedback on questions
- Reply to user feedback
- Manage users
- Manage subscriptions and payment status
- Manage referral codes and referral rewards
- Review reported questions and fix errors

## Notifications

The system should send useful notifications to users for important events.

Notifications should include:

- OTP email
- Payment confirmation
- Subscription expiry reminder
- Feedback reply
- Test completion summary
- Referral reward update

## Legal and Trust

The platform should include the required trust and policy pages for a paid education product.

These should include:

- Terms and conditions
- Privacy policy
- Refund policy
- Contact or support page
- Practice/preparation disclaimer
- Account deletion or data deletion request process

## Mobile Responsiveness

The full app should work well on mobile devices.

The mobile experience should define how users interact with the test console, calculator, notes, highlights, question navigation, timer, and answer choices on smaller screens.

All buttons, answer options, timers, and navigation controls should be touch-friendly and easy to use during a test.
