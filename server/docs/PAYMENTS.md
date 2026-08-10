# Razorpay payments

PBX Nursing Plus costs ₹899 (`89900` paise) and grants 60 days of access. These values are owned by the server in `services/paymentService.js`; clients submit only the plan name.

## Configuration

Set these server variables:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Set `VITE_RAZORPAY_KEY_ID` in the client to the matching public key ID. Never expose either server secret to the client.

Run `npm run db:migrate` from `server/` before starting the updated application.

## Razorpay dashboard

Create a webhook pointing to:

`https://<api-host>/api/v1/payments/webhook`

Subscribe to `payment.captured` and `order.paid`, and use the same webhook secret configured in `RAZORPAY_WEBHOOK_SECRET`. Enable automatic payment capture in Razorpay.

Both the Checkout callback and webhook verify Razorpay data and call the same idempotent fulfilment transaction. The first captured confirmation creates the subscription; duplicate or reordered confirmations do not extend it again.
