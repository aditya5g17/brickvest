import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/format";

function OwnershipCertificate() {
  const { investmentId } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestment = async () => {
      const snapshot = await getDoc(doc(db, "investments", investmentId));

      if (snapshot.exists()) {
        setInvestment({ id: snapshot.id, ...snapshot.data() });
      }

      setLoading(false);
    };

    fetchInvestment();
  }, [investmentId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 p-10 text-white">Loading...</div>;
  }

  if (!investment) {
    return (
      <div className="min-h-screen bg-gray-950 p-10 text-white">
        Certificate not found.
      </div>
    );
  }

  const canView = isAdmin || investment.userId === currentUser?.uid;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-950 p-10 text-white">
        Only the owner can view this certificate.
      </div>
    );
  }

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white print:bg-white print:text-black">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          <Link to="/portfolio" className="text-blue-400 hover:text-blue-300">
            ← Portfolio
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
          >
            Download / Print
          </button>
        </div>

        <div className="rounded-xl border-2 border-blue-500/40 bg-gray-900 p-8 print:border-gray-400 print:bg-white">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-blue-400 print:text-blue-800">
            BrickVest
          </p>
          <h1 className="mt-2 text-center text-3xl font-bold">Digital Ownership Certificate</h1>
          <p className="mt-2 text-center text-sm text-gray-400 print:text-gray-600">
            Demo document — not a legal title deed
          </p>

          <div className="mt-8 space-y-4 border-t border-gray-800 pt-6 text-sm print:border-gray-300">
            <p><span className="text-gray-500">Certificate ID:</span> {investment.id}</p>
            <p><span className="text-gray-500">Investor:</span> {investment.userEmail}</p>
            <p><span className="text-gray-500">Property:</span> {investment.propertyTitle}</p>
            <p><span className="text-gray-500">Shares owned:</span> {investment.shares}</p>
            <p>
              <span className="text-gray-500">Ownership:</span>{" "}
              {investment.ownershipPercent ?? "—"}% of property
            </p>
            <p>
              <span className="text-gray-500">Amount invested:</span>{" "}
              {formatCurrency(investment.totalInvestment)}
            </p>
            <p>
              <span className="text-gray-500">Date:</span> {formatDate(investment.createdAt)}
            </p>
            <p>
              <span className="text-gray-500">Payment:</span>{" "}
              {investment.paymentProvider === "brickvest_sandbox" ? "Sandbox (Demo)" : "Razorpay"}
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 print:text-gray-600">
            BrickVest fractional real estate demo platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default OwnershipCertificate;
