import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import toast from "react-hot-toast";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utils/format";
import {
  buildPortfolioSummary,
  buildTaxReportPayload,
  buildTaxSummary,
  buildThisMonthSummary,
  downloadCsvReport,
  downloadJsonReport,
  generateIncomeHistory,
  pickTopOpportunities,
} from "../utils/calculations";
import { normalizeProperty } from "../utils/propertyHelpers";
import { simulateRentCreditNotification } from "../utils/notifications";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler
);

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [creditingRent, setCreditingRent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setLoading(true);

      const investmentsQuery = query(
        collection(db, "investments"),
        where("userId", "==", currentUser.uid)
      );

      const [investmentsSnapshot, propertiesSnapshot] = await Promise.all([
        getDocs(investmentsQuery),
        getDocs(collection(db, "properties")),
      ]);

      const investments = investmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const propertyMap = Object.fromEntries(
        propertiesSnapshot.docs.map((doc) => [
          doc.id,
          normalizeProperty({ id: doc.id, ...doc.data() }),
        ])
      );

      const portfolio = buildPortfolioSummary(investments, propertyMap);
      const history = generateIncomeHistory(investments, propertyMap, 6);
      const topPicks = pickTopOpportunities(
        propertiesSnapshot.docs.map((doc) =>
          normalizeProperty({ id: doc.id, ...doc.data() })
        )
      );

      setSummary(portfolio);
      setIncomeHistory(history);
      setOpportunities(topPicks);
      setChartData({
        labels: portfolio.enriched.map((inv) => inv.propertyTitle || "Property"),
        datasets: [
          {
            data: portfolio.enriched.map((inv) => inv.totalInvestment || 0),
            backgroundColor: ["#0a2540", "#b8862e", "#1e4976", "#059669", "#64748b"],
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      });
      setLoading(false);
    };

    fetchData();
  }, [currentUser]);

  const thisMonth = useMemo(
    () => buildThisMonthSummary(summary?.monthlyRent || 0),
    [summary?.monthlyRent]
  );

  const taxSummary = useMemo(
    () => buildTaxSummary(summary?.totalEarned || 0),
    [summary?.totalEarned]
  );

  const incomeChartData = useMemo(
    () => ({
      labels: incomeHistory.map((row) => row.label),
      datasets: [
        {
          label: "Rental income",
          data: incomeHistory.map((row) => row.amount),
          borderColor: "#b8862e",
          backgroundColor: "rgba(184, 134, 46, 0.12)",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [incomeHistory]
  );

  const handleDownloadJson = () => {
    if (!summary) return;
    const payload = buildTaxReportPayload(currentUser, summary, summary.enriched);
    downloadJsonReport("brickvest-tax-report.json", payload);
  };

  const handleDownloadCsv = () => {
    if (!summary) return;
    const payload = buildTaxReportPayload(currentUser, summary, summary.enriched);
    downloadCsvReport("brickvest-tax-report.csv", payload);
  };

  const displayName = userProfile?.name || currentUser?.displayName || "Investor";

  const handleSimulateRentCredit = async () => {
    if (!currentUser || !summary?.monthlyRent) {
      toast.error("Invest first to simulate a rent credit.");
      return;
    }

    setCreditingRent(true);
    try {
      const result = await simulateRentCreditNotification(
        currentUser.uid,
        summary.monthlyRent
      );

      if (result.created) {
        toast.success(
          `Rent credited: Rs.${Math.round(summary.monthlyRent).toLocaleString()} (demo)`
        );
      } else {
        toast("Rent already credited this month (demo).", { icon: "ℹ️" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not create rent notification.");
    } finally {
      setCreditingRent(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container py-10 md:py-12">
          <span className="badge badge-gold mb-3 inline-flex">Portfolio Dashboard</span>
          <div className="divider-gold mb-4" />
          <h1 className="heading-section">Welcome, {displayName}</h1>
          <p className="mt-2 text-muted">Your investment control center</p>
        </div>
      </section>

      <div className="page-container py-10">

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Invested", value: formatCurrency(summary?.totalInvested || 0), tone: "text-[var(--navy)]" },
            {
              label: "Current Value",
              value: formatCurrency(summary?.currentValue || 0),
              sub: summary?.valueChangePercent ? `${summary.valueChangePercent >= 0 ? "+" : ""}${summary.valueChangePercent}%` : "",
              tone: "text-[var(--success)]",
            },
            { label: "Total Earned (Rent)", value: formatCurrency(Math.round(summary?.totalEarned || 0)), tone: "text-[var(--gold)]" },
            { label: "Monthly Rent", value: formatCurrency(Math.round(summary?.monthlyRent || 0)), tone: "text-[var(--navy-light)]" },
          ].map((card) => (
            <div key={card.label} className="card p-5">
              <p className="text-sm text-muted">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
              {card.sub ? <p className="mt-1 text-xs text-muted">{card.sub} vs invested</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">This Month</h2>
            <div className="space-y-3 text-sm">
              <p>
                Rental income:{" "}
                <span className="font-semibold text-green-300">
                  {formatCurrency(thisMonth.rentalIncome)} {thisMonth.credited ? "credited" : ""}
                </span>
              </p>
              <p className="text-gray-400">Last credit: {thisMonth.lastCreditLabel}</p>
              <p className="text-gray-400">
                Next credit: {thisMonth.nextCreditLabel} ({thisMonth.daysUntilNext} days)
              </p>
              <button
                type="button"
                onClick={handleSimulateRentCredit}
                disabled={creditingRent || !summary?.monthlyRent}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creditingRent ? "Crediting..." : "Simulate rent credit (demo)"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Performance</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-gray-500">ROI</p>
                <p className="text-2xl font-bold text-blue-400">{summary?.roiPercent || 0}%</p>
              </div>
              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-gray-500">Avg. yield</p>
                <p className="text-2xl font-bold text-green-400">{summary?.avgYield || 0}%</p>
              </div>
              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-gray-500">Properties</p>
                <p className="text-2xl font-bold">{summary?.propertyCount || 0}</p>
              </div>
              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-gray-500">Capital gain (demo)</p>
                <p className="text-2xl font-bold text-yellow-300">
                  {formatCurrency(Math.round((summary?.currentValue || 0) - (summary?.totalInvested || 0)))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Income History</h2>
            {incomeHistory.length === 0 ? (
              <p className="text-gray-400">Invest to see your rent history here.</p>
            ) : (
              <>
                <Line
                  data={incomeChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                      y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                    },
                  }}
                />
                <div className="mt-4 space-y-2">
                  {incomeHistory.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm text-gray-300">
                      <span>{row.label}</span>
                      <span>{formatCurrency(row.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {chartData && summary?.propertyCount > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-semibold">Allocation</h2>
              <Doughnut data={chartData} />
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Investment Timeline</h2>
          {summary?.enriched?.length ? (
            <div className="space-y-4">
              {summary.enriched.map((inv) => (
                <div key={inv.id} className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="font-semibold">{inv.propertyTitle}</p>
                  <div className="mt-2 grid gap-2 text-sm text-gray-400 sm:grid-cols-3">
                    <p>
                      Invested:{" "}
                      {inv.timeline.investedOn.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      Rent started:{" "}
                      {inv.timeline.rentStartedOn.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      Projected exit:{" "}
                      {inv.timeline.projectedExitOn.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No investment timeline yet.</p>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Tax Summary (Demo)</h2>
            <div className="space-y-2 text-sm">
              <p>Taxable rental income: {formatCurrency(taxSummary.taxableIncome)}</p>
              <p>TDS deducted ({taxSummary.tdsRatePercent}%): {formatCurrency(taxSummary.tdsDeducted)}</p>
              <p className="font-semibold text-green-300">Net income: {formatCurrency(taxSummary.netIncome)}</p>
              <p className="text-xs text-gray-500">{taxSummary.note}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              >
                Download JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold hover:border-blue-500"
              >
                Download CSV
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">New Opportunities</h2>
            {opportunities.length === 0 ? (
              <p className="text-gray-400">No open listings right now.</p>
            ) : (
              <div className="space-y-3">
                {opportunities.map((property) => (
                  <Link
                    key={property.id}
                    to={`/property/${property.id}`}
                    className="block rounded-lg border border-gray-800 bg-gray-950 p-4 hover:border-blue-500"
                  >
                    <p className="font-semibold">{property.title}</p>
                    <p className="text-sm text-gray-400">{property.location}</p>
                    <p className="mt-1 text-sm text-green-400">{property.rentalYield}% yield</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/recommendations" className="text-blue-400 hover:text-blue-300">
                Smart recommendations →
              </Link>
              <Link to="/marketplace" className="text-blue-400 hover:text-blue-300">
                View all properties →
              </Link>
            </div>
          </div>
        </div>

        {summary?.enriched?.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Portfolio Breakdown</h2>
            <Bar
              data={{
                labels: summary.enriched.map((inv) => inv.propertyTitle),
                datasets: [
                  {
                    label: "Invested",
                    data: summary.enriched.map((inv) => inv.totalInvestment),
                    backgroundColor: "#2563eb",
                  },
                  {
                    label: "Current value (demo)",
                    data: summary.enriched.map((inv) => Math.round(inv.currentValue)),
                    backgroundColor: "#16a34a",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { labels: { color: "#d1d5db" } } },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                  y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
