import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { formatCurrency, formatDate, paymentStatusLabel } from "../utils/format";

function AdminTransactions() {
  const [tab, setTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [paymentsSnapshot, investmentsSnapshot] = await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "investments")),
        ]);

        const paymentRows = paymentsSnapshot.docs
          .map((paymentDoc) => ({ id: paymentDoc.id, ...paymentDoc.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        const investmentRows = investmentsSnapshot.docs
          .map((investmentDoc) => ({ id: investmentDoc.id, ...investmentDoc.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        setPayments(paymentRows);
        setInvestments(investmentRows);
      } catch (err) {
        console.error(err);
        setError("Could not load transactions. Check admin permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold">Platform Transactions</h1>
        <p className="mb-8 text-gray-400">Admin view of all payments and investments.</p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`rounded-lg px-4 py-2 font-semibold ${
              tab === "payments" ? "bg-blue-600" : "border border-gray-700"
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("investments")}
            className={`rounded-lg px-4 py-2 font-semibold ${
              tab === "investments" ? "bg-blue-600" : "border border-gray-700"
            }`}
          >
            Investments ({investments.length})
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tab === "payments" ? (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-gray-400">No payments yet.</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">{payment.propertyTitle}</p>
                      <p className="text-sm text-gray-400">{payment.userEmail}</p>
                    </div>
                    <span className="text-sm text-yellow-200">
                      {paymentStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-6 text-sm">
                    <span>{formatCurrency(payment.amount)}</span>
                    <span>{payment.shares} shares</span>
                    <span className="text-gray-400">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {investments.length === 0 ? (
              <p className="text-gray-400">No investments yet.</p>
            ) : (
              investments.map((investment) => (
                <div key={investment.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">{investment.propertyTitle}</p>
                      <p className="text-sm text-gray-400">{investment.userEmail}</p>
                    </div>
                    <span className="text-sm text-green-300">{investment.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-6 text-sm">
                    <span>{formatCurrency(investment.totalInvestment)}</span>
                    <span>{investment.shares} shares</span>
                    <span className="text-gray-400">{formatDate(investment.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTransactions;
