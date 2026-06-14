import { BUDGET_BUCKETS } from "../constants/propertyMeta";
import {
  extractCity,
  getDaysUntilDeadline,
  getFundingStatus,
  normalizeProperty,
} from "./propertyHelpers";

const RISK_RANK = { low: 1, medium: 2, high: 3 };

const HORIZON_LABELS = {
  short: "1–2 years",
  medium: "3–5 years",
  long: "5+ years",
};

export const PREFERRED_CITIES = [
  "Any",
  "Mumbai",
  "Delhi",
  "New Delhi",
  "Bangalore",
  "Bengaluru",
  "Pune",
  "Gurugram",
  "Gurgaon",
  "Noida",
  "Hyderabad",
  "Jaipur",
];

export const HORIZON_OPTIONS = [
  { value: "short", label: "Short term (1–2 years)" },
  { value: "medium", label: "Medium (3–5 years)" },
  { value: "long", label: "Long term (5+ years)" },
];

export function getInvestorProfile(userProfile = {}) {
  return {
    risk: userProfile.riskProfile || "medium",
    goal: userProfile.investmentGoal || "balanced",
    budget: userProfile.budgetRange || "all",
    city: userProfile.preferredCity || "Any",
    horizon: userProfile.investmentHorizon || "medium",
  };
}

function scoreRiskMatch(propertyRisk, userRisk) {
  const propertyRank = RISK_RANK[propertyRisk] || 2;
  const userRank = RISK_RANK[userRisk] || 2;
  const gap = Math.abs(propertyRank - userRank);

  if (gap === 0) return 25;
  if (gap === 1) return 16;
  return 6;
}

function scoreGoalMatch(property, goal) {
  const yieldPercent = Number(property.rentalYield) || 6;
  const growth = Number(property.growthScore) || 5;

  if (goal === "income") {
    if (yieldPercent >= 8) return 25;
    if (yieldPercent >= 6.5) return 18;
    return 10;
  }

  if (goal === "growth") {
    if (growth >= 8) return 25;
    if (growth >= 6) return 18;
    return 10;
  }

  const yieldPart = yieldPercent >= 6.5 ? 13 : 8;
  const growthPart = growth >= 6 ? 12 : 7;
  return yieldPart + growthPart;
}

function scoreCityMatch(property, preferredCity) {
  if (!preferredCity || preferredCity === "Any") return 12;

  const haystack = `${property.city || ""} ${property.location || ""}`.toLowerCase();
  const needle = preferredCity.toLowerCase();

  if (haystack.includes(needle)) return 22;
  if (needle.includes("gurgaon") && haystack.includes("gurugram")) return 22;
  if (needle.includes("bangalore") && haystack.includes("bengaluru")) return 22;
  return 0;
}

function scoreBudgetFit(property, budgetId) {
  const sharePrice = Number(property.sharePrice) || 0;
  if (!budgetId || budgetId === "all") return 12;

  const bucket = BUDGET_BUCKETS.find((item) => item.id === budgetId);
  if (!bucket) return 8;

  if (sharePrice >= bucket.min && sharePrice <= bucket.max) return 20;
  if (sharePrice < bucket.min) return 8;
  return 4;
}

function scoreHorizonMatch(property, horizon) {
  const daysLeft = getDaysUntilDeadline(property);

  if (horizon === "short") {
    if (daysLeft != null && daysLeft <= 365) return 15;
    return 7;
  }

  if (horizon === "long") {
    if (daysLeft == null || daysLeft > 180) return 15;
    return 8;
  }

  return 12;
}

function scoreGrowth(property) {
  return Math.min(8, Number(property.growthScore) || 5);
}

function getTimingHint(property) {
  const daysLeft = getDaysUntilDeadline(property);
  if (daysLeft == null) return null;
  if (daysLeft <= 5) return "Funding closes in 5 days — invest now";
  if (daysLeft <= 30) return `${daysLeft} days left on funding window`;
  return null;
}

export function scoreProperty(property, userProfile) {
  const normalized = normalizeProperty(property);
  const profile = getInvestorProfile(userProfile);

  if (getFundingStatus(normalized) !== "open") {
    return null;
  }

  const reasons = [];
  let score = 0;

  const riskPoints = scoreRiskMatch(normalized.riskLevel, profile.risk);
  score += riskPoints;
  if (riskPoints >= 20) reasons.push("Risk level matches your profile");

  const goalPoints = scoreGoalMatch(normalized, profile.goal);
  score += goalPoints;
  if (goalPoints >= 18) reasons.push("Aligns with your investment goal");

  const cityPoints = scoreCityMatch(normalized, profile.city);
  score += cityPoints;
  if (cityPoints >= 20) reasons.push(`Matches preferred city (${profile.city})`);

  const budgetPoints = scoreBudgetFit(normalized, profile.budget);
  score += budgetPoints;
  if (budgetPoints >= 18) reasons.push("Fits your budget per share");

  score += scoreHorizonMatch(normalized, profile.horizon);
  score += scoreGrowth(normalized);

  const timing = getTimingHint(normalized);
  if (timing) {
    score += 10;
    reasons.push(timing);
  }

  return {
    property: normalized,
    score: Math.round(score),
    reasons,
    timing,
    matchPercent: Math.min(99, Math.round(score)),
  };
}

export function rankProperties(properties, userProfile, limit = 3) {
  return properties
    .map((property) => scoreProperty(property, userProfile))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildProfileSummary(userProfile) {
  const profile = getInvestorProfile(userProfile);
  return {
    ...profile,
    horizonLabel: HORIZON_LABELS[profile.horizon] || profile.horizon,
    budgetLabel:
      BUDGET_BUCKETS.find((bucket) => bucket.id === profile.budget)?.label || "Any budget",
  };
}

export function buildChatRecommendationText(ranked, userProfile) {
  const summary = buildProfileSummary(userProfile);

  if (!ranked.length) {
    return `Profile: ${summary.risk} risk, ${summary.goal} goal, ${summary.city}, ${summary.budgetLabel}. No open verified properties match yet — check the marketplace.`;
  }

  const lines = ranked.map((item, index) => {
    const medal = index === 0 ? "#1" : index === 1 ? "#2" : "#3";
    return `${medal} ${item.property.title} (${item.property.rentalYield}% yield, score ${item.score}) — ${item.reasons.slice(0, 2).join("; ")}`;
  });

  return `Your profile (${summary.risk} risk, ${summary.goal}, ${summary.city}): ${lines.join(" | ")}`;
}
