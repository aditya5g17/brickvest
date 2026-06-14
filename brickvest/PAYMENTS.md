# BrickVest Payments Setup

BrickVest supports two payment modes:

- `sandbox` default: internal OTP-based payment simulation for college demo.
- `razorpay`: Razorpay Test Mode through Firebase Cloud Functions.

The sandbox still creates backend payment records and creates investments only after OTP verification.

## Sandbox mode

No PAN/KYC is required.
No Firebase Blaze plan is required.

1. Publish Firestore rules.
2. Invest from the app.
3. Use OTP `123456`.

Do not set `VITE_PAYMENT_PROVIDER`, or set it to anything other than `razorpay`.

In sandbox mode, the frontend writes owner-scoped `payments` and `investments`
records to Firestore after OTP verification. Firestore rules restrict these
writes to the logged-in user's own sandbox records.

## Razorpay mode

Razorpay mode requires Firebase Cloud Functions, which requires Firebase Blaze
plan deployment.

## 1. Install function dependencies

```bash
cd functions
npm install
```

## 2. Set Razorpay secrets

Use Razorpay Dashboard test keys.

```bash
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
```

## 3. Deploy backend and rules

```bash
firebase deploy --only functions,firestore:rules
```

## 4. Enable Razorpay checkout in frontend

Create `.env.local`:

```bash
VITE_PAYMENT_PROVIDER=razorpay
```

## Payment flow

1. User selects shares in `InvestModal`.
2. Frontend calls payment order function.
3. Firebase Function creates `payments` record.
4. Razorpay Checkout or Sandbox OTP opens.
5. On success, frontend calls verification function.
6. Firebase Function verifies signature and creates `investments` record.

Never put Razorpay secret key in frontend code.
