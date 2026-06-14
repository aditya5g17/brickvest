import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase/config";
import { buildPropertyPayload } from "../utils/buildPropertyPayload";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      const snapshot = await getDoc(doc(db, "properties", id));

      if (!snapshot.exists()) {
        setError("Property not found.");
        setLoading(false);
        return;
      }

      const data = snapshot.data();
      setForm({
        title: data.title || "",
        location: data.location || "",
        city: data.city || "",
        image: data.image || "",
        price: String(data.price ?? ""),
        sharePrice: String(data.sharePrice ?? ""),
        rentalYield: String(data.rentalYield ?? "6"),
        growthScore: String(data.growthScore ?? "5"),
        fundedPercent: String(data.fundedPercent ?? "0"),
        type: data.type || "Commercial",
        propertyCategory: data.propertyCategory || "commercial",
        riskLevel: data.riskLevel || "medium",
        legalStatus: data.legalStatus || "verified",
        constructionStatus: data.constructionStatus || "ready",
        fundingDeadline: data.fundingDeadline || "",
        maxOwnershipPercent: String(data.maxOwnershipPercent ?? "20"),
        latitude: data.latitude != null ? String(data.latitude) : "",
        longitude: data.longitude != null ? String(data.longitude) : "",
      });
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const existingSnap = await getDoc(doc(db, "properties", id));
      const existing = existingSnap.data() || {};

      await updateDoc(doc(db, "properties", id), {
        ...buildPropertyPayload(form, existing.createdBy),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        updatedAt: serverTimestamp(),
      });

      toast.success("Property updated.");
      navigate(`/property/${id}`);
    } catch (err) {
      console.error(err);
      setError("Could not update property.");
      toast.error("Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 p-10 text-white">Loading...</div>;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-950 p-10 text-white">
        <p>{error || "Property not found."}</p>
        <Link to="/marketplace" className="mt-4 inline-block text-blue-400">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold">Edit Property</h1>
        <p className="mb-8 text-gray-400">Update verified listing details.</p>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["title", "Property title", "text"],
              ["location", "Location", "text"],
              ["image", "Image URL", "url"],
              ["type", "Asset type", "text"],
              ["price", "Total value", "number"],
              ["sharePrice", "Share price", "number"],
              ["rentalYield", "Rental yield (%)", "number"],
              ["growthScore", "Growth score", "number"],
              ["fundedPercent", "Funded %", "number"],
              ["fundingDeadline", "Funding deadline", "date"],
              ["riskLevel", "Risk (low/medium/high)", "text"],
              ["propertyCategory", "Category", "text"],
              ["latitude", "Latitude (optional)", "number"],
              ["longitude", "Longitude (optional)", "number"],
            ].map(([name, label, type]) => (
              <div key={name} className={name === "title" || name === "image" ? "md:col-span-2" : ""}>
                <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-300">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  required={!["latitude", "longitude"].includes(name)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link
              to={`/property/${id}`}
              className="rounded-lg border border-gray-700 px-5 py-3 hover:border-gray-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProperty;
