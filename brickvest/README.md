# BrickVest

Fractional real estate investment demo built with React, Vite, Firebase, and optional Razorpay payments.

## Features

- Verified property marketplace with search, filters, and funding progress
- Market feed → admin review queue → publish workflow
- Sandbox OTP payments (demo OTP: `123456`)
- Optional Razorpay via Cloud Functions
- User dashboard, portfolio, and payment history
- Admin dashboard, transactions view, property edit, user promotion

## Quick start

```bash
cd brickvest
npm install
npm run dev
```

## Firebase setup

1. Create a Firebase project and enable **Authentication** (Email/Password) and **Firestore**.
2. Copy your web config into `src/firebase/config.js` (or use environment variables in production).
3. Deploy security rules:

```bash
npm run deploy:rules
```

## First admin user

1. Register a normal account in the app.
2. In Firebase Console → Firestore → `users/{your-uid}`, set `role` to `admin`.
3. Log out and log in again. Admin links will appear in the navbar.

Additional admins can be promoted from **Admin Dashboard → Promote user to admin**.

## Sandbox payments (default)

- Do not set `VITE_PAYMENT_PROVIDER`, or set it to anything other than `razorpay`.
- Invest on a property → OTP modal → use `123456`.
- Successful investments update `fundedPercent` on the property.

See [PAYMENTS.md](./PAYMENTS.md) for Razorpay mode.

## Build & deploy hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

Full backend deploy:

```bash
npm run deploy:backend
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run deploy:rules` | Deploy Firestore rules |
| `npm run deploy:functions` | Deploy Cloud Functions |
| `npm run deploy:backend` | Deploy rules + functions |

## Disclaimer

BrickVest is a demonstration platform. It is not registered with SEBI. Listings and yields are illustrative unless verified by licensed partners.
