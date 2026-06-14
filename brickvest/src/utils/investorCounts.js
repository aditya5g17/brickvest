import {
  collection,
  doc,
  getCountFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function registerPropertyInvestor(propertyId, userId) {
  if (!propertyId || !userId) return;

  await setDoc(
    doc(db, "propertyInvestors", propertyId, "members", userId),
    {
      userId,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function fetchInvestorCountsForProperties(propertyIds = []) {
  const uniqueIds = [...new Set(propertyIds.filter(Boolean))];
  const counts = {};

  await Promise.all(
    uniqueIds.map(async (propertyId) => {
      try {
        const snapshot = await getCountFromServer(
          collection(db, "propertyInvestors", propertyId, "members")
        );
        counts[propertyId] = snapshot.data().count;
      } catch (error) {
        console.warn(`Investor count failed for ${propertyId}`, error);
        counts[propertyId] = 0;
      }
    })
  );

  return counts;
}
