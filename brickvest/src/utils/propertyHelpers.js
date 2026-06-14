import { MAX_OWNERSHIP_PERCENT } from "../constants/propertyMeta";
import { computeTotalShares } from "./propertyFunding";

export function extractCity(location = "") {
  return String(location).split(",")[0].trim() || "Other";
}

export function normalizePropertyCategory(type = "") {
  const value = String(type).toLowerCase();
  if (value.includes("mix")) return "mixed";
  if (value.includes("commercial") || value.includes("office") || value.includes("retail") || value.includes("warehouse")) {
    return "commercial";
  }
  if (value.includes("residential") || value.includes("flat") || value.includes("villa") || value.includes("apartment")) {
    return "residential";
  }
  return "commercial";
}

export function normalizeProperty(property = {}) {
  const totalShares = computeTotalShares(property);
  const fundedShares = Number(property.fundedShares) || 0;
  const fundedPercent = Math.min(
    100,
    Number(property.fundedPercent) || Math.round((fundedShares / totalShares) * 100)
  );

  return {
    ...property,
    city: property.city || extractCity(property.location),
    propertyCategory: property.propertyCategory || normalizePropertyCategory(property.type),
    rentalYield: Number(property.rentalYield || property.expectedReturn || 6),
    growthScore: Number(property.growthScore || 5),
    riskLevel: property.riskLevel || "medium",
    legalStatus: property.legalStatus || "verified",
    constructionStatus: property.constructionStatus || "ready",
    investmentHorizon: property.investmentHorizon || "long",
    totalShares,
    fundedShares,
    fundedPercent,
    maxOwnershipPercent: Number(property.maxOwnershipPercent) || MAX_OWNERSHIP_PERCENT,
  };
}

export function getFundingStatus(property) {
  const normalized = normalizeProperty(property);
  if (normalized.fundedPercent >= 100) return "funded";

  if (normalized.fundingDeadline) {
    const deadline = normalized.fundingDeadline?.toDate
      ? normalized.fundingDeadline.toDate()
      : new Date(normalized.fundingDeadline);
    if (!Number.isNaN(deadline.getTime()) && deadline < new Date()) {
      return "closed";
    }
  }

  return "open";
}

export function getDaysUntilDeadline(property) {
  if (!property?.fundingDeadline) return null;

  const deadline = property.fundingDeadline?.toDate
    ? property.fundingDeadline.toDate()
    : new Date(property.fundingDeadline);

  if (Number.isNaN(deadline.getTime())) return null;

  const diff = deadline.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRemainingShares(property) {
  const normalized = normalizeProperty(property);
  return Math.max(0, normalized.totalShares - normalized.fundedShares);
}

export function computeOwnershipPercent(shares, totalShares) {
  if (!totalShares) return 0;
  return Math.round((Number(shares) / Number(totalShares)) * 10000) / 100;
}

export function getUserShareLimit(property, userSharesHeld = 0) {
  const normalized = normalizeProperty(property);
  const maxShares = Math.floor(
    normalized.totalShares * (normalized.maxOwnershipPercent / 100)
  );
  return Math.max(0, maxShares - Number(userSharesHeld || 0));
}

export function validateSharePurchase(property, userSharesHeld, sharesToBuy) {
  const normalized = normalizeProperty(property);
  const shares = Number(sharesToBuy);
  const status = getFundingStatus(property);
  const remaining = getRemainingShares(property);
  const maxCanBuy = getUserShareLimit(property, userSharesHeld);

  if (status === "funded") {
    return { ok: false, message: "This property is fully funded." };
  }
  if (status === "closed") {
    return { ok: false, message: "The funding deadline has passed." };
  }
  if (!Number.isInteger(shares) || shares < 1) {
    return { ok: false, message: "Minimum 1 share required." };
  }
  if (shares > remaining) {
    return { ok: false, message: `Only ${remaining} shares remaining.` };
  }
  if (shares > maxCanBuy) {
    return {
      ok: false,
      message: `You can own up to ${normalized.maxOwnershipPercent}% (${maxCanBuy} shares).`,
    };
  }

  return {
    ok: true,
    ownershipPercent: computeOwnershipPercent(userSharesHeld + shares, normalized.totalShares),
  };
}

export function matchesBudget(sharePrice, budgetId, buckets) {
  if (budgetId === "all") return true;
  const bucket = buckets.find((item) => item.id === budgetId);
  if (!bucket) return true;
  const price = Number(sharePrice) || 0;
  return price >= bucket.min && price <= bucket.max;
}

export function propertyMatchesFilters(property, filters, buckets) {
  const normalized = normalizeProperty(property);
  const status = getFundingStatus(property);
  const daysLeft = getDaysUntilDeadline(property);
  const sharePrice = Number(property.sharePrice) || 0;

  if (filters.category !== "all" && normalized.propertyCategory !== filters.category) {
    return false;
  }

  if (filters.city !== "All" && !String(property.location || "").toLowerCase().startsWith(filters.city.toLowerCase())) {
    return false;
  }

  if (filters.risk !== "all" && normalized.riskLevel !== filters.risk) {
    return false;
  }

  if (filters.propertyType !== "all" && !String(property.type || "").toLowerCase().includes(filters.propertyType.toLowerCase())) {
    return false;
  }

  if (filters.yield !== "all" && normalized.rentalYield < Number(filters.yield)) {
    return false;
  }

  if (filters.status === "open" && status !== "open") return false;
  if (filters.status === "funded" && status !== "funded") return false;

  if (filters.duration === "short" && (daysLeft === null || daysLeft >= 90)) return false;
  if (filters.duration === "long" && daysLeft !== null && daysLeft < 90) return false;

  if (!matchesBudget(sharePrice, filters.budget, buckets)) return false;

  const queryText = filters.search?.trim().toLowerCase();
  if (queryText) {
    const haystack = `${property.title} ${property.location} ${property.type} ${property.city}`.toLowerCase();
    if (!haystack.includes(queryText)) return false;
  }

  return true;
}

export function buildInvestmentRecord(property, payload) {
  const normalized = normalizeProperty(property);
  const ownershipPercent = computeOwnershipPercent(payload.shares, normalized.totalShares);

  return {
    ...payload,
    propertyCity: normalized.city,
    totalShares: normalized.totalShares,
    ownershipPercent,
  };
}

export function defaultFundingDeadline(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}
