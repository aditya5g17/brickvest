import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utils/format";
import { normalizeProperty } from "../utils/propertyHelpers";
import {
  buildProfileSummary,
  rankProperties,
} from "../utils/recommendations";

function Recommendations() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const snapshot = await getDocs(collection(db, "properties"));
        const properties = snapshot.docs.map((doc) =>
          normalizeProperty({ id: doc.id, ...doc.data() })
        );

        setPicks(rankProperties(properties, userProfile, 3));
      } catch (err) {
        console.error(err);
        setError("Could not load recommendations.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userProfile]);

  const summary = buildProfileSummary(userProfile);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
          Smart Match (Demo)
        </p>
        <h1 className="mt-2 text-3xl font-bold">Recommendations For You</h1>
        <p className="mt-2 text-gray-400">
          Rule-based scoring — real ML will ship in production. Not financial advice.
        </p>

        <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Demo recommendations — not financial advice. Scores are illustrative only.
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-gray-800 bg-gray-900 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Risk</p>
            <p className="font-semibold capitalize">{summary.risk}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Goal</p>
            <p className="font-semibold capitalize">{summary.goal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">City</p>
            <p className="font-semibold">{summary.city}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Budget / share</p>
            <p className="font-semibold">{summary.budgetLabel}</p>
          </div>
        </div>

        {loading ? (
          <p className="mt-10 text-gray-400">Matching properties...</p>
        ) : error ? (
          <p className="mt-10 text-red-300">{error}</p>
        ) : picks.length === 0 ? (
          <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400">No open properties match your profile.</p>
            <Link to="/marketplace" className="mt-4 inline-block text-blue-400">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {picks.map((pick, index) => (
              <div
                key={pick.property.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-blue-400">
                      {index === 0 ? "Best match" : index === 1 ? "Good match" : "Also consider"} · Score{" "}
                      {pick.score}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{pick.property.title}</h2>
                    <p className="text-gray-400">{pick.property.location}</p>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-300">
                    {pick.matchPercent}% match
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                  <p>Yield: <strong>{pick.property.rentalYield}%</strong></p>
                  <p>Growth: <strong>{pick.property.growthScore}/10</strong></p>
                  <p>Share: <strong>{formatCurrency(pick.property.sharePrice)}</strong></p>
                  <p className="capitalize">Risk: <strong>{pick.property.riskLevel}</strong></p>
                </div>

                {pick.timing && (
                  <p className="mt-3 text-sm font-medium text-yellow-200">{pick.timing}</p>
                )}

                <ul className="mt-3 list-inside list-disc text-sm text-gray-400">
                  {pick.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>

                <Link
                  to={`/property/${pick.property.id}`}
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2 font-semibold hover:bg-blue-700"
                >
                  View & Invest
                </Link>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-500">
          Scoring uses: risk match + goal + city + budget per share + growth + funding deadline.
        </p>
      </div>
    </div>
  );
}

export default Recommendations;
