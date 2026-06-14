import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { buildPropertyPayload } from "../utils/buildPropertyPayload";
import { defaultFundingDeadline } from "../utils/propertyHelpers";

function ReviewQueue() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchQueue = async () => {
      try {
        const queueQuery = query(
          collection(db, "reviewQueue"),
          where("status", "==", "pending")
        );
        const snapshot = await getDocs(queueQuery);
        const data = snapshot.docs.map((queueDoc) => ({
          id: queueDoc.id,
          ...queueDoc.data(),
        }));

        if (isMounted) {
          setItems(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Could not load review queue. Check Firebase permissions.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  const publishToVerified = async (item) => {
    setPublishingId(item.id);
    setError("");

    try {
      const sharePrice = Math.max(5000, Math.round((item.price || 0) / 1000));
      const price = Number(item.price || 0);

      await addDoc(collection(db, "properties"), {
        ...buildPropertyPayload(
          {
            title: item.title,
            location: item.location,
            image: item.image,
            price: String(price),
            sharePrice: String(sharePrice),
            rentalYield: "6",
            growthScore: "6",
            fundedPercent: "0",
            type: item.type || "Commercial",
            propertyCategory: "commercial",
            riskLevel: "medium",
            legalStatus: "verified",
            constructionStatus: "ready",
            fundingDeadline: defaultFundingDeadline(30),
          },
          currentUser.uid
        ),
        source: item.source,
        sourceListingId: item.sourceListingId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "reviewQueue", item.id), {
        status: "published",
        publishedBy: currentUser.uid,
        publishedAt: serverTimestamp(),
      });

      setItems((current) => current.filter((queueItem) => queueItem.id !== item.id));
      toast.success("Published to verified marketplace.");
    } catch (err) {
      console.error(err);
      setError("Could not publish verified property. Check Firebase permissions.");
      toast.error("Publish failed.");
    } finally {
      setPublishingId("");
    }
  };

  const rejectListing = async (item) => {
    if (!rejectReason.trim()) {
      setError("A reject reason is required.");
      return;
    }

    setRejectingId(item.id);
    setError("");

    try {
      await updateDoc(doc(db, "reviewQueue", item.id), {
        status: "rejected",
        rejectReason: rejectReason.trim(),
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
      });

      setItems((current) => current.filter((queueItem) => queueItem.id !== item.id));
      setRejectReason("");
      toast.success("Listing rejected.");
    } catch (err) {
      console.error(err);
      setError("Could not reject listing.");
      toast.error("Reject failed.");
    } finally {
      setRejectingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-3xl font-bold">Review Queue</h1>
        <p className="mb-8 max-w-2xl text-gray-400">
          Admin-only area: listings saved from Market Feed are reviewed here. Publishing moves them to Verified Properties.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <label htmlFor="rejectReason" className="mb-2 block text-sm text-gray-400">
            Default reject reason (for publish reject buttons)
          </label>
          <input
            id="rejectReason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="e.g. Incomplete documentation"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading review queue...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">Nothing to review</h2>
            <p className="text-gray-400">Listings saved from Market Feed will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.id} className="grid gap-5 rounded-xl border border-gray-800 bg-gray-900 p-5 md:grid-cols-[220px_1fr_auto]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-44 w-full rounded-lg object-cover md:h-full"
                />

                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                      {item.type}
                    </span>
                    <span className="rounded-full bg-gray-950 px-3 py-1 text-sm text-gray-300">
                      {item.source}
                    </span>
                  </div>

                  <h2 className="mb-2 text-2xl font-semibold">{item.title}</h2>
                  <p className="mb-3 text-gray-400">{item.location}</p>
                  <p className="text-blue-400">Price: Rs.{Number(item.price || 0).toLocaleString()}</p>
                  <p className="text-gray-300">Area: {item.area}</p>
                  <p className="text-gray-300">Saved by: {item.savedByEmail}</p>
                </div>

                <div className="flex flex-col gap-3 md:items-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => publishToVerified(item)}
                    disabled={publishingId === item.id}
                    className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                  >
                    {publishingId === item.id ? "Publishing..." : "Publish to Verified"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectListing(item)}
                    disabled={rejectingId === item.id}
                    className="w-full rounded-lg border border-red-500/50 px-5 py-3 font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60 md:w-auto"
                  >
                    {rejectingId === item.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewQueue;
