export function calculateInvestmentTotal(sharePrice = 0, shares = 0) {
  return Number(sharePrice) * Number(shares);
}

export function calculateMonthlyRent(totalInvestment = 0, annualYieldPercent = 0) {
  return (Number(totalInvestment) * (Number(annualYieldPercent) / 100)) / 12;
}

export function calculateProjectedValue(totalInvestment = 0, annualGrowthPercent = 0, years = 0) {
  return Number(totalInvestment) * Math.pow(1 + Number(annualGrowthPercent) / 100, Number(years));
}

export function calculateInvestmentProjection({
  amount = 0,
  rentalYield = 6,
  annualGrowth = 5,
  years = 5,
}) {
  const investedAmount = Number(amount);
  const monthlyRent = calculateMonthlyRent(investedAmount, rentalYield);
  const totalRent = monthlyRent * 12 * Number(years);
  const projectedValue = calculateProjectedValue(investedAmount, annualGrowth, years);
  const totalReturns = totalRent + projectedValue - investedAmount;

  return {
    monthlyRent,
    totalRent,
    projectedValue,
    totalReturns,
    finalValue: projectedValue + totalRent,
  };
}

/** Fixed demo rates — not live market data */
export const BENCHMARK_RATES = {
  fd: { id: "fd", label: "Fixed Deposit", annualRate: 7, note: "Assumed 7% p.a. (demo)" },
  gold: { id: "gold", label: "Gold", annualRate: 8, note: "Assumed 8% p.a. (demo)" },
};

export function calculateCompoundMaturity(amount = 0, annualRatePercent = 0, years = 0) {
  const principal = Number(amount);
  const rate = Number(annualRatePercent) / 100;
  const maturity = principal * Math.pow(1 + rate, Number(years));
  return {
    maturityValue: maturity,
    totalGain: maturity - principal,
    annualRatePercent: Number(annualRatePercent),
  };
}

export function compareWithBenchmarks({ amount, years, rentalYield, annualGrowth }) {
  const brickvest = calculateInvestmentProjection({
    amount,
    rentalYield,
    annualGrowth,
    years,
  });
  const fd = calculateCompoundMaturity(amount, BENCHMARK_RATES.fd.annualRate, years);
  const gold = calculateCompoundMaturity(amount, BENCHMARK_RATES.gold.annualRate, years);

  const options = [
    {
      id: "brickvest",
      label: "BrickVest (rent + growth)",
      finalValue: brickvest.finalValue,
      totalGain: brickvest.finalValue - Number(amount),
      highlight: true,
      detail: `${rentalYield}% yield + ${annualGrowth}% growth (demo model)`,
    },
    {
      id: "fd",
      label: BENCHMARK_RATES.fd.label,
      finalValue: fd.maturityValue,
      totalGain: fd.totalGain,
      detail: BENCHMARK_RATES.fd.note,
    },
    {
      id: "gold",
      label: BENCHMARK_RATES.gold.label,
      finalValue: gold.maturityValue,
      totalGain: gold.totalGain,
      detail: BENCHMARK_RATES.gold.note,
    },
  ];

  const best = options.reduce((top, item) => (item.finalValue > top.finalValue ? item : top), options[0]);

  return { brickvest, fd, gold, options, bestId: best.id };
}

export function toJsDate(value) {
  if (!value) return new Date();
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function monthsSince(dateValue) {
  const start = toJsDate(dateValue);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, months + (now.getDate() >= start.getDate() ? 0 : -1));
}

export function yearsSince(dateValue) {
  return monthsSince(dateValue) / 12;
}

/** Demo current value: invested × (1 + growthScore/100 × years) */
export function calculateCurrentValue(invested = 0, growthScore = 5, investDate) {
  const years = yearsSince(investDate);
  return Number(invested) * (1 + (Number(growthScore) / 100) * years);
}

export function calculateTotalEarned(monthlyRent = 0, investDate) {
  return Number(monthlyRent) * monthsSince(investDate);
}

export function calculateRoiPercent(totalInvested, totalEarned, currentValue) {
  if (!totalInvested) return 0;
  const totalGain = Number(totalEarned) + (Number(currentValue) - Number(totalInvested));
  return Math.round((totalGain / Number(totalInvested)) * 1000) / 10;
}

export function calculateWeightedYield(investments = [], propertyMap = {}) {
  let invested = 0;
  let weighted = 0;

  investments.forEach((investment) => {
    const amount = Number(investment.totalInvestment) || 0;
    const property = propertyMap[investment.propertyId] || {};
    const yieldPercent = Number(property.rentalYield || investment.rentalYield || 6);
    invested += amount;
    weighted += amount * yieldPercent;
  });

  return invested ? Math.round((weighted / invested) * 10) / 10 : 0;
}

export function enrichInvestment(investment, propertyMap = {}) {
  const property = propertyMap[investment.propertyId] || {};
  const growthScore = Number(property.growthScore || 5);
  const rentalYield = Number(property.rentalYield || 6);
  const invested = Number(investment.totalInvestment) || 0;
  const monthlyRent = Number(investment.estimatedMonthlyRent) || calculateMonthlyRent(invested, rentalYield);
  const monthsHeld = monthsSince(investment.createdAt);
  const yearsHeld = yearsSince(investment.createdAt);
  const currentValue = calculateCurrentValue(invested, growthScore, investment.createdAt);
  const totalEarned = calculateTotalEarned(monthlyRent, investment.createdAt);

  const investDate = toJsDate(investment.createdAt);
  const rentStart = new Date(investDate);
  rentStart.setMonth(rentStart.getMonth() + 1);
  const projectedExit = new Date(investDate);
  projectedExit.setFullYear(projectedExit.getFullYear() + 5);

  return {
    ...investment,
    growthScore,
    rentalYield,
    monthlyRent,
    monthsHeld,
    yearsHeld,
    currentValue,
    totalEarned,
    roiPercent: calculateRoiPercent(invested, totalEarned, currentValue),
    timeline: {
      investedOn: investDate,
      rentStartedOn: rentStart,
      projectedExitOn: projectedExit,
    },
  };
}

export function buildPortfolioSummary(investments = [], propertyMap = {}) {
  const enriched = investments.map((inv) => enrichInvestment(inv, propertyMap));

  const totalInvested = enriched.reduce((sum, inv) => sum + (inv.totalInvestment || 0), 0);
  const currentValue = enriched.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalEarned = enriched.reduce((sum, inv) => sum + inv.totalEarned, 0);
  const monthlyRent = enriched.reduce((sum, inv) => sum + inv.monthlyRent, 0);
  const roiPercent = calculateRoiPercent(totalInvested, totalEarned, currentValue);
  const avgYield = calculateWeightedYield(investments, propertyMap);
  const valueChangePercent = totalInvested
    ? Math.round(((currentValue - totalInvested) / totalInvested) * 1000) / 10
    : 0;

  return {
    enriched,
    totalInvested,
    currentValue,
    totalEarned,
    monthlyRent,
    roiPercent,
    avgYield,
    valueChangePercent,
    propertyCount: enriched.length,
  };
}

export function generateIncomeHistory(investments = [], propertyMap = {}, monthCount = 6) {
  const rows = [];
  const now = new Date();

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const label = monthDate.toLocaleString("en-IN", { month: "short", year: "numeric" });

    let amount = 0;
    investments.forEach((investment) => {
      const investDate = toJsDate(investment.createdAt);
      const rentStart = new Date(investDate);
      rentStart.setMonth(rentStart.getMonth() + 1);
      rentStart.setDate(1);

      if (monthDate >= rentStart) {
        const property = propertyMap[investment.propertyId] || {};
        const invested = Number(investment.totalInvestment) || 0;
        const monthlyRent =
          Number(investment.estimatedMonthlyRent) ||
          calculateMonthlyRent(invested, property.rentalYield || 6);
        amount += monthlyRent;
      }
    });

    rows.push({ label, amount: Math.round(amount), monthDate });
  }

  return rows;
}

export function buildThisMonthSummary(monthlyRent) {
  const now = new Date();
  const lastCredit = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextCredit = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const daysUntilNext = Math.max(0, Math.ceil((nextCredit - now) / (1000 * 60 * 60 * 24)));

  return {
    rentalIncome: Math.round(monthlyRent),
    lastCreditLabel: lastCredit.toLocaleString("en-IN", { day: "numeric", month: "short" }),
    nextCreditLabel: nextCredit.toLocaleString("en-IN", { day: "numeric", month: "short" }),
    daysUntilNext,
    credited: monthlyRent > 0,
  };
}

export function buildTaxSummary(totalEarned = 0) {
  const taxableIncome = Math.round(totalEarned);
  const tdsRate = 0.1;
  const tdsDeducted = Math.round(taxableIncome * tdsRate);
  const netIncome = taxableIncome - tdsDeducted;

  return {
    taxableIncome,
    tdsDeducted,
    netIncome,
    tdsRatePercent: tdsRate * 100,
    note: "Demo tax summary — not for official filing.",
  };
}

export function buildTaxReportPayload(user, summary, enrichedInvestments) {
  return {
    generatedAt: new Date().toISOString(),
    investor: user?.email || "",
    financialYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    summary: buildTaxSummary(summary.totalEarned),
    portfolio: {
      totalInvested: summary.totalInvested,
      currentValue: summary.currentValue,
      totalEarned: summary.totalEarned,
    },
    investments: enrichedInvestments.map((inv) => ({
      property: inv.propertyTitle,
      invested: inv.totalInvestment,
      rentalEarned: Math.round(inv.totalEarned),
      ownershipPercent: inv.ownershipPercent,
    })),
  };
}

export function downloadJsonReport(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvReport(filename, payload) {
  const lines = [
    "Property,Invested,Rental Earned,Ownership %",
    ...payload.investments.map(
      (row) =>
        `"${row.property}",${row.invested},${row.rentalEarned},${row.ownershipPercent ?? ""}`
    ),
    "",
    `Taxable Income,${payload.summary.taxableIncome}`,
    `TDS Deducted,${payload.summary.tdsDeducted}`,
    `Net Income,${payload.summary.netIncome}`,
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function pickTopOpportunities(properties = [], limit = 3) {
  return [...properties]
    .filter((property) => Number(property.fundedPercent || 0) < 100)
    .sort((a, b) => Number(b.rentalYield || 0) - Number(a.rentalYield || 0))
    .slice(0, limit);
}
