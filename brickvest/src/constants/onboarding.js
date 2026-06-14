export const ONBOARDING_STEPS = [
  { id: "basic", title: "Basic Details", subtitle: "Enter your personal details" },
  { id: "kyc", title: "KYC", subtitle: "Demo verification (Aadhaar, PAN, Selfie)" },
  { id: "bank", title: "Bank Account", subtitle: "Rental income will be credited here" },
  { id: "risk", title: "Risk Profile", subtitle: "How much risk can you take?" },
  { id: "goal", title: "Investment Goal", subtitle: "Income or growth?" },
  { id: "done", title: "Activate", subtitle: "Activate your account" },
];

export const RISK_OPTIONS = [
  {
    value: "low",
    label: "Low Risk",
    description: "Stable rent, fewer ups and downs",
  },
  {
    value: "medium",
    label: "Medium Risk",
    description: "Balance of rent plus moderate growth",
  },
  {
    value: "high",
    label: "High Risk",
    description: "Higher growth, more volatile",
  },
];

export const BUDGET_OPTIONS = [
  { value: "all", label: "Any budget (per share)" },
  { value: "5k-50k", label: "Rs.5K – 50K per share" },
  { value: "50k-2l", label: "Rs.50K – 2L per share" },
  { value: "2l-plus", label: "Rs.2L+ per share" },
];

export const CITY_OPTIONS = [
  "Any",
  "Mumbai",
  "Delhi",
  "New Delhi",
  "Bangalore",
  "Pune",
  "Gurugram",
  "Noida",
  "Hyderabad",
  "Jaipur",
];

export const HORIZON_OPTIONS = [
  { value: "short", label: "Short (1–2 years)" },
  { value: "medium", label: "Medium (3–5 years)" },
  { value: "long", label: "Long (5+ years)" },
];

export const GOAL_OPTIONS = [
  {
    value: "income",
    label: "Monthly Income",
    description: "Monthly rent-like returns",
  },
  {
    value: "growth",
    label: "Long-term Growth",
    description: "Focus on property value appreciation",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Both — rent and appreciation",
  },
];

export function maskAadhaar(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskPan(value = "") {
  const pan = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (pan.length < 4) return "";
  return `XXXXX${pan.slice(-4)}`;
}

export function maskBankAccount(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `**** **** ${digits.slice(-4)}`;
}
