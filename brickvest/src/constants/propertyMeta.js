export const PROPERTY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "mixed", label: "Mixed Use" },
];

export const RISK_LEVELS = ["low", "medium", "high"];

export const BUDGET_BUCKETS = [
  { id: "all", label: "Any budget", min: 0, max: Infinity },
  { id: "5k-50k", label: "Rs.5K – 50K", min: 5000, max: 50000 },
  { id: "50k-2l", label: "Rs.50K – 2L", min: 50000, max: 200000 },
  { id: "2l-plus", label: "Rs.2L+", min: 200000, max: Infinity },
];

export const YIELD_FILTERS = [
  { id: "all", label: "Any yield" },
  { id: "6", label: "6%+ yearly" },
  { id: "8", label: "8%+ yearly" },
  { id: "10", label: "10%+ yearly" },
];

export const STATUS_FILTERS = [
  { id: "all", label: "All status" },
  { id: "open", label: "Funding open" },
  { id: "funded", label: "Fully funded" },
];

export const DURATION_FILTERS = [
  { id: "all", label: "Any duration" },
  { id: "short", label: "Short term (< 90 days)" },
  { id: "long", label: "Long term (90+ days)" },
];

export const MAX_OWNERSHIP_PERCENT = 20;

export const PAYMENT_MODES = [
  { id: "upi", label: "UPI", description: "Demo sandbox" },
  { id: "netbanking", label: "Net Banking", description: "Demo sandbox" },
  { id: "card", label: "Credit / Debit Card", description: "Demo sandbox" },
];
