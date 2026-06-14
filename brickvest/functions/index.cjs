const crypto = require("crypto");
const admin = require("firebase-admin");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const Razorpay = require("razorpay");

admin.initializeApp();

const db = admin.firestore();
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

function computeTotalShares(property) {
  const sharePrice = Number(property.sharePrice) || 1;
  const price = Number(property.price) || 0;
  const explicit = Number(property.totalShares);

  if (explicit > 0) return explicit;
  return Math.max(1, Math.floor(price / sharePrice));
}

function getEffectiveFundingBaseline(property) {
  const totalShares =
    Number(property.totalShares) > 0
      ? Number(property.totalShares)
      : computeTotalShares(property);

  let fundedShares = Number(property.fundedShares);
  if (!Number.isFinite(fundedShares) || fundedShares < 0) {
    fundedShares = 0;
  }

  if (fundedShares === 0 && Number(property.fundedPercent) > 0 && totalShares > 0) {
    fundedShares = Math.round((Number(property.fundedPercent) / 100) * totalShares);
  }

  fundedShares = Math.min(totalShares, Math.max(0, fundedShares));

  return { totalShares, fundedShares };
}

async function applyInvestmentFunding(propertyId, sharesInvested) {
  const propertyRef = db.collection("properties").doc(propertyId);
  const propertySnap = await propertyRef.get();

  if (!propertySnap.exists) return;

  const property = propertySnap.data();
  const baseline = getEffectiveFundingBaseline(property);
  const shares = Math.max(1, Number(sharesInvested) || 0);
  const fundedShares = Math.min(baseline.totalShares, baseline.fundedShares + shares);
  const fundedPercent = Math.min(
    100,
    Math.round((fundedShares / baseline.totalShares) * 100)
  );

  await propertyRef.update({
    totalShares: baseline.totalShares,
    fundedShares,
    fundedPercent,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function assertSignedIn(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
}

function getRazorpayClient() {
  return new Razorpay({
    key_id: razorpayKeyId.value(),
    key_secret: razorpayKeySecret.value(),
  });
}

exports.createPaymentOrder = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    assertSignedIn(request);

    const { propertyId, shares } = request.data || {};
    const shareCount = Number(shares);

    if (!propertyId || !Number.isInteger(shareCount) || shareCount < 1) {
      throw new HttpsError("invalid-argument", "Valid propertyId and shares are required.");
    }

    const propertySnap = await db.collection("properties").doc(propertyId).get();

    if (!propertySnap.exists) {
      throw new HttpsError("not-found", "Property not found.");
    }

    const property = propertySnap.data();
    const sharePrice = Number(property.sharePrice || 0);
    const amount = sharePrice * shareCount;

    if (!sharePrice || amount < 1) {
      throw new HttpsError("failed-precondition", "Property share price is invalid.");
    }

    const receipt = `brickvest_${Date.now()}_${request.auth.uid.slice(0, 8)}`;
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      notes: {
        userId: request.auth.uid,
        propertyId,
        shares: String(shareCount),
      },
    });

    const paymentRef = await db.collection("payments").add({
      userId: request.auth.uid,
      userEmail: request.auth.token.email || "",
      propertyId,
      propertyTitle: property.title,
      sharePrice,
      shares: shareCount,
      amount,
      estimatedMonthlyRent:
        (amount * (Number(property.rentalYield || property.expectedReturn || 6) / 100)) / 12,
      razorpayOrderId: order.id,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      paymentId: paymentRef.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId.value(),
      propertyTitle: property.title,
    };
  }
);

exports.verifyPayment = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    assertSignedIn(request);

    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = request.data || {};

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new HttpsError("invalid-argument", "Payment verification details are required.");
    }

    const paymentRef = db.collection("payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throw new HttpsError("not-found", "Payment record not found.");
    }

    const payment = paymentSnap.data();

    if (payment.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You cannot verify this payment.");
    }

    if (payment.razorpayOrderId !== razorpayOrderId) {
      throw new HttpsError("failed-precondition", "Order id mismatch.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret.value())
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await paymentRef.update({
        status: "failed",
        failureReason: "signature_mismatch",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw new HttpsError("permission-denied", "Payment signature verification failed.");
    }

    const investmentRef = await db.collection("investments").add({
      userId: payment.userId,
      userEmail: payment.userEmail,
      propertyId: payment.propertyId,
      propertyTitle: payment.propertyTitle,
      sharePrice: payment.sharePrice,
      shares: payment.shares,
      totalInvestment: payment.amount,
      estimatedMonthlyRent: payment.estimatedMonthlyRent,
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      paymentStatus: "paid",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await paymentRef.update({
      status: "paid",
      razorpayPaymentId,
      razorpaySignature,
      investmentId: investmentRef.id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await applyInvestmentFunding(payment.propertyId, payment.shares);

    return {
      success: true,
      investmentId: investmentRef.id,
    };
  }
);

exports.createSandboxPayment = onCall(async (request) => {
  assertSignedIn(request);

  const { propertyId, shares } = request.data || {};
  const shareCount = Number(shares);

  if (!propertyId || !Number.isInteger(shareCount) || shareCount < 1) {
    throw new HttpsError("invalid-argument", "Valid propertyId and shares are required.");
  }

  const propertySnap = await db.collection("properties").doc(propertyId).get();

  if (!propertySnap.exists) {
    throw new HttpsError("not-found", "Property not found.");
  }

  const property = propertySnap.data();
  const sharePrice = Number(property.sharePrice || 0);
  const amount = sharePrice * shareCount;

  if (!sharePrice || amount < 1) {
    throw new HttpsError("failed-precondition", "Property share price is invalid.");
  }

  const paymentRef = await db.collection("payments").add({
    userId: request.auth.uid,
    userEmail: request.auth.token.email || "",
    propertyId,
    propertyTitle: property.title,
    sharePrice,
    shares: shareCount,
    amount,
    estimatedMonthlyRent:
      (amount * (Number(property.rentalYield || property.expectedReturn || 6) / 100)) / 12,
    provider: "brickvest_sandbox",
    sandboxOtp: "123456",
    status: "otp_pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    paymentId: paymentRef.id,
    amount,
    currency: "INR",
    propertyTitle: property.title,
    maskedAccount: "BrickVest Sandbox Bank **** 2042",
  };
});

exports.verifySandboxPayment = onCall(async (request) => {
  assertSignedIn(request);

  const { paymentId, otp } = request.data || {};

  if (!paymentId || !otp) {
    throw new HttpsError("invalid-argument", "Payment id and OTP are required.");
  }

  const paymentRef = db.collection("payments").doc(paymentId);
  const paymentSnap = await paymentRef.get();

  if (!paymentSnap.exists) {
    throw new HttpsError("not-found", "Payment record not found.");
  }

  const payment = paymentSnap.data();

  if (payment.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "You cannot verify this payment.");
  }

  if (payment.status === "paid" && payment.investmentId) {
    return {
      success: true,
      investmentId: payment.investmentId,
    };
  }

  if (payment.provider !== "brickvest_sandbox") {
    throw new HttpsError("failed-precondition", "This is not a sandbox payment.");
  }

  if (String(otp) !== payment.sandboxOtp) {
    await paymentRef.update({
      status: "otp_failed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new HttpsError("permission-denied", "Invalid OTP.");
  }

  const investmentRef = await db.collection("investments").add({
    userId: payment.userId,
    userEmail: payment.userEmail,
    propertyId: payment.propertyId,
    propertyTitle: payment.propertyTitle,
    sharePrice: payment.sharePrice,
    shares: payment.shares,
    totalInvestment: payment.amount,
    estimatedMonthlyRent: payment.estimatedMonthlyRent,
    paymentId,
    paymentProvider: "brickvest_sandbox",
    paymentStatus: "paid",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await paymentRef.update({
    status: "paid",
    investmentId: investmentRef.id,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await applyInvestmentFunding(payment.propertyId, payment.shares);

  return {
    success: true,
    investmentId: investmentRef.id,
  };
});
