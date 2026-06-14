import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { marketFeedProperties } from "../data/marketFeed";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

function MarketFeed() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [city, setCity] = useState("All");
  const [type, setType] = useState("All");
  const [savedIds, setSavedIds] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const cities = useMemo(
    () => ["All", ...new Set(marketFeedProperties.map((property) => property.location.split(",")[0]))],
    []
  );

  const types = useMemo(
    () => ["All", ...new Set(marketFeedProperties.map((property) => property.type))],
    []
  );

  const filteredProperties = marketFeedProperties.filter((property) => {
    const matchesCity = city === "All" || property.location.startsWith(city);
    const matchesType = type === "All" || property.type === type;

    return matchesCity && matchesType;
  });

  const saveForReview = async (property) => {
    if (!currentUser) {
      navigate("/login", { state: { from: { pathname: "/market-feed" } } });
      return;
    }

    if (savedIds.includes(property.id)) return;

    setError("");
    setSavingId(property.id);

    try {
      await addDoc(collection(db, "reviewQueue"), {
        ...property,
        sourceListingId: property.id,
        status: "pending",
        savedBy: currentUser.uid,
        savedByEmail: currentUser.email,
        savedAt: serverTimestamp(),
      });

      setSavedIds((current) => [...current, property.id]);
      toast.success("Saved for admin review.");
    } catch (err) {
      console.error(err);
      toast.error("Save failed.");
      setError("Could not save listing to review queue. Check Firebase permissions.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
              Raw Market Feed
            </p>
            <h1 className="text-4xl font-bold">Live Market Opportunities</h1>
            <p className="mt-3 max-w-2xl text-gray-400">
              This is a demo feed. In the future, this section will fetch live listings from paid APIs or broker feeds.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Market Feed listings are not investment-ready. Review them and publish to Verified Properties.
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => {
            const isSaved = savedIds.includes(property.id);

            return (
              <div key={property.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
                <img
                  src={property.image}
                  alt={property.title}
                  className="h-56 w-full object-cover"
                />

                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                      {property.type}
                    </span>
                    <span className="text-sm text-gray-400">{property.source}</span>
                  </div>

                  <h2 className="mb-2 text-xl font-semibold">{property.title}</h2>
                  <p className="mb-3 text-gray-400">{property.location}</p>

                  <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold text-blue-400">Rs.{property.price.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-gray-500">Area</p>
                      <p className="font-semibold">{property.area}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => saveForReview(property)}
                    disabled={savingId === property.id || isSaved}
                    className={`w-full rounded-lg px-4 py-3 font-semibold ${
                      isSaved
                        ? "border border-green-500/40 bg-green-500/10 text-green-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {savingId === property.id ? "Saving..." : isSaved ? "Saved for Review" : "Save for Review"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MarketFeed;
