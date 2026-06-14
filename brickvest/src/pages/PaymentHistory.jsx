import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate, paymentStatusLabel } from "../utils/format";

function PaymentHistory() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!currentUser) return;

      setLoading(true);

      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(paymentsQuery);
      const data = snapshot.docs
        .map((paymentDoc) => ({
          id: paymentDoc.id,
          ...paymentDoc.data(),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setPayments(data);
      setLoading(false);
    };

    fetchPayments();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold">Payment History</h1>
        <p className="mb-8 text-gray-400">
          View all your investment payments and their status here.
        </p>

        {loading ? (
          <p className="text-gray-400">Loading payments...</p>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400">No payment records yet.</p>
            <Link to="/marketplace" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{payment.propertyTitle}</h2>
                    <p className="text-sm text-gray-400">{formatDate(payment.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      payment.status === "paid"
                        ? "bg-green-500/10 text-green-300"
                        : payment.status === "failed" || payment.status === "otp_failed"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-yellow-500/10 text-yellow-200"
                    }`}
                  >
                    {paymentStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-semibold text-blue-400">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Shares</p>
                    <p className="font-semibold">{payment.shares}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Provider</p>
                    <p className="font-semibold">
                      {payment.provider === "brickvest_sandbox" ? "Sandbox" : "Razorpay"}
                    </p>
                  </div>
                </div>

                {payment.propertyId && (
                  <Link
                    to={`/property/${payment.propertyId}`}
                    className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
                  >
                    View property
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
