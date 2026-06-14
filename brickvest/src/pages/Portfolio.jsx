import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import PageHeader from "../components/PageHeader";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utils/format";

function Portfolio() {
  const { currentUser } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!currentUser) return;

      setLoading(true);

      const investmentsQuery = query(
        collection(db, "investments"),
        where("userId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(investmentsQuery);

      const data = snapshot.docs.map((investmentDoc) => ({
        id: investmentDoc.id,
        ...investmentDoc.data(),
      }));

      setInvestments(data);
      setTotal(data.reduce((sum, inv) => sum + (inv.totalInvestment || 0), 0));
      setLoading(false);
    };

    fetchInvestments();
  }, [currentUser]);

  return (
    <div className="page-shell pb-16">
      <PageHeader
        eyebrow="Your Holdings"
        title="My Portfolio"
        description="Track fractional ownership across all your verified property investments."
        action={
          <Link to="/marketplace" className="btn btn-primary">
            Invest More
          </Link>
        }
      />

      <div className="page-container py-10">
        <div className="card mb-8 p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Total Invested</p>
          <p className="mt-2 font-display text-4xl font-bold text-[var(--navy)]">
            {loading ? "—" : formatCurrency(total)}
          </p>
          <p className="mt-1 text-sm text-muted">{investments.length} active investment(s)</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--gold)]" />
          </div>
        ) : investments.length === 0 ? (
          <div className="card p-12 text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--navy)]">No investments yet</h2>
            <p className="mt-2 text-muted">Start building your real estate portfolio today.</p>
            <Link to="/marketplace" className="btn btn-primary mt-6">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((inv) => (
              <div key={inv.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--navy)]">
                      {inv.propertyTitle}
                    </h2>
                    <p className="mt-1 font-medium text-[var(--gold)]">
                      {inv.ownershipPercent != null
                        ? `${inv.ownershipPercent}% ownership`
                        : `${inv.shares} shares`}
                    </p>
                  </div>
                  <Link to={`/certificate/${inv.id}`} className="btn btn-outline btn-sm">
                    Certificate
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg bg-[var(--cream)] p-3">
                    <p className="text-xs uppercase text-muted">Shares</p>
                    <p className="font-semibold">{inv.shares}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--cream)] p-3">
                    <p className="text-xs uppercase text-muted">Invested</p>
                    <p className="font-semibold">{formatCurrency(inv.totalInvestment)}</p>
                  </div>
                  {inv.estimatedMonthlyRent ? (
                    <div className="rounded-lg bg-[var(--cream)] p-3">
                      <p className="text-xs uppercase text-muted">Est. Rent/mo</p>
                      <p className="font-semibold text-[var(--success)]">
                        {formatCurrency(Math.round(inv.estimatedMonthlyRent))}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
