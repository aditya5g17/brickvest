import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export function computeTotalShares(property) {
  const sharePrice = Number(property?.sharePrice) || 1;
  const price = Number(property?.price) || 0;
  const explicit = Number(property?.totalShares);

  if (explicit > 0) return explicit;
  return Math.max(1, Math.floor(price / sharePrice));
}

export function seedFundingFromPercent(property) {
  const totalShares = computeTotalShares(property);
  const fundedPercent = Math.min(100, Math.max(0, Number(property.fundedPercent) || 0));
  const fundedShares = Math.round((fundedPercent / 100) * totalShares);

  return { totalShares, fundedShares, fundedPercent };
}

export function buildPropertyFundingFields(property) {
  const totalShares = computeTotalShares(property);
  let fundedShares = Math.min(
    totalShares,
    Math.max(0, Number(property?.fundedShares) || 0)
  );

  if (!fundedShares && property?.fundedPercent != null) {
    const percent = Math.min(100, Math.max(0, Number(property.fundedPercent) || 0));
    fundedShares = Math.round((percent / 100) * totalShares);
  }

  const fundedPercent = Math.min(
    100,
    Math.max(0, Math.round((fundedShares / totalShares) * 100))
  );

  return { totalShares, fundedShares, fundedPercent };
}

/** Use stored totalShares when present; derive funded shares from % if missing */
export function getEffectiveFundingBaseline(property) {
  const totalShares =
    Number(property?.totalShares) > 0
      ? Number(property.totalShares)
      : computeTotalShares(property);

  let fundedShares = Number(property?.fundedShares);
  if (!Number.isFinite(fundedShares) || fundedShares < 0) {
    fundedShares = 0;
  }

  if (fundedShares === 0 && Number(property?.fundedPercent) > 0 && totalShares > 0) {
    fundedShares = Math.round((Number(property.fundedPercent) / 100) * totalShares);
  }

  fundedShares = Math.min(totalShares, Math.max(0, fundedShares));

  const fundedPercent = Math.min(
    100,
    Math.max(0, Math.round((fundedShares / totalShares) * 100))
  );

  return { totalShares, fundedShares, fundedPercent };
}

export function nextFundingState(property, sharesInvested) {
  const baseline = getEffectiveFundingBaseline(property);
  const shares = Math.max(1, Number(sharesInvested) || 0);
  const fundedShares = Math.min(
    baseline.totalShares,
    baseline.fundedShares + shares
  );
  const fundedPercent = Math.min(
    100,
    Math.round((fundedShares / baseline.totalShares) * 100)
  );

  return {
    totalShares: baseline.totalShares,
    fundedShares,
    fundedPercent,
  };
}

export async function applyInvestmentFunding(propertyId, property, sharesInvested, options = {}) {
  const { isNewInvestor = false } = options;
  const { totalShares, fundedShares, fundedPercent } = nextFundingState(property, sharesInvested);

  const payload = {
    totalShares,
    fundedShares,
    fundedPercent,
    updatedAt: serverTimestamp(),
  };

  if (isNewInvestor) {
    payload.investorCount = (Number(property?.investorCount) || 0) + 1;
  }

  await updateDoc(doc(db, "properties", propertyId), payload);

  return { totalShares, fundedShares, fundedPercent, investorCount: payload.investorCount };
}
