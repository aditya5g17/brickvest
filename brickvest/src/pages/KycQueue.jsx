import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase/config";

const DEFAULT_REJECT_REASON = "Documents could not be verified (demo). Please resubmit.";

function KycQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState(DEFAULT_REJECT_REASON);
  const [processingId, setProcessingId] = useState("");

  const loadQueue = async () => {
    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(
        query(collection(db, "users"), where("kycStatus", "==", "pending_review"))
      );
      setItems(
        snapshot.docs.map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Could not load KYC queue. Check Firebase permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const approveKyc = async (user) => {
    setProcessingId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        kycStatus: "verified",
        kycReviewedAt: serverTimestamp(),
        kycRejectReason: null,
      });
      toast.success(`KYC approved for ${user.email || user.name || user.id}`);
      setItems((current) => current.filter((item) => item.id !== user.id));
    } catch (err) {
      console.error(err);
      toast.error("Could not approve KYC.");
    } finally {
      setProcessingId("");
    }
  };

  const rejectKyc = async (user) => {
    if (!rejectReason.trim()) {
      toast.error("A reject reason is required.");
      return;
    }

    setProcessingId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        kycStatus: "rejected",
        kycReviewedAt: serverTimestamp(),
        kycRejectReason: rejectReason.trim(),
      });
      toast.success(`KYC rejected for ${user.email || user.name || user.id}`);
      setItems((current) => current.filter((item) => item.id !== user.id));
    } catch (err) {
      console.error(err);
      toast.error("Could not reject KYC.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">KYC Review Queue</h1>
        <p className="mt-2 text-gray-400">
          Demo KYC submissions from onboarding. Approve or reject like the property review queue.
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <label htmlFor="reject-reason" className="mb-2 block text-sm text-gray-300">
            Default reject reason
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <p className="mt-10 text-gray-400">Loading queue...</p>
        ) : error ? (
          <p className="mt-10 text-red-300">{error}</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400">No pending KYC submissions.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{user.name || "Investor"}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <p className="mt-2 text-sm text-gray-300">
                      Aadhaar: {user.aadhaarMasked || "—"} · PAN: {user.panMasked || "—"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Phone: {user.phone || "—"} · Selfie: {user.selfieUploaded ? "Uploaded (demo)" : "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200">
                    Pending review
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={processingId === user.id}
                    onClick={() => approveKyc(user)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === user.id}
                    onClick={() => rejectKyc(user)}
                    className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Reject
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

export default KycQueue;
