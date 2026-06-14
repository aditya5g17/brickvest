import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function createNotification({ userId, type, title, body, meta = {} }) {
  if (!userId) return null;

  const ref = await addDoc(collection(db, "notifications"), {
    userId,
    type,
    title,
    body,
    meta,
    read: false,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(userId) {
  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    )
  );

  await Promise.all(
    snapshot.docs.map((notificationDoc) => markNotificationRead(notificationDoc.id))
  );
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Demo: one rent credit notification per calendar month */
export async function simulateRentCreditNotification(userId, monthlyRentAmount) {
  const monthKey = currentMonthKey();
  const existing = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", userId))
  );

  const alreadyThisMonth = existing.docs.some(
    (notificationDoc) =>
      notificationDoc.data().type === "rent_credited" &&
      notificationDoc.data().meta?.monthKey === monthKey
  );

  if (alreadyThisMonth) {
    return { created: false, reason: "already_credited" };
  }

  const amount = Math.round(Number(monthlyRentAmount) || 0);
  const id = await createNotification({
    userId,
    type: "rent_credited",
    title: "Rent credited",
    body: `Rs.${amount.toLocaleString()} demo rental income was credited to your linked bank account.`,
    meta: { monthKey, amount },
  });

  return { created: true, id };
}
