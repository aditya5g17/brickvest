import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { buildPropertyPayload } from "../utils/buildPropertyPayload";
import { defaultFundingDeadline } from "../utils/propertyHelpers";
import { PROPERTY_CATEGORIES, RISK_LEVELS } from "../constants/propertyMeta";

const initialForm = {
  title: "",
  location: "",
  city: "",
  image: "",
  price: "",
  sharePrice: "",
  rentalYield: "6",
  growthScore: "5",
  fundedPercent: "0",
  type: "Commercial Office",
  propertyCategory: "commercial",
  subType: "",
  riskLevel: "medium",
  legalStatus: "verified",
  constructionStatus: "ready",
  investmentHorizon: "long",
  fundingDeadline: defaultFundingDeadline(30),
  maxOwnershipPercent: "20",
};

function AddProperty() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const docRef = await addDoc(
        collection(db, "properties"),
        {
          ...buildPropertyPayload(form, currentUser.uid),
          createdAt: serverTimestamp(),
        }
      );

      toast.success("Property added!");
      navigate(`/property/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not add property.");
      setError("Could not add property. Check Firebase permissions or form values.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold">Add Property</h1>
        <p className="mb-8 text-gray-400">
          Admin-only area: create a new investment property for the verified marketplace.
        </p>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-300">
                Property title
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Premium Office Space"
              />
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-300">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Gurugram, Haryana"
              />
            </div>

            <div>
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-300">
                Image URL
              </label>
              <input
                id="image"
                name="image"
                type="url"
                value={form.image}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-medium text-gray-300">
                Total value
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="1"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="25000000"
              />
            </div>

            <div>
              <label htmlFor="sharePrice" className="mb-2 block text-sm font-medium text-gray-300">
                Share price
              </label>
              <input
                id="sharePrice"
                name="sharePrice"
                type="number"
                min="1"
                value={form.sharePrice}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="5000"
              />
            </div>

            <div>
              <label htmlFor="rentalYield" className="mb-2 block text-sm font-medium text-gray-300">
                Rental yield (%)
              </label>
              <input
                id="rentalYield"
                name="rentalYield"
                type="number"
                min="0"
                step="0.1"
                value={form.rentalYield}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-300">
                Asset type
              </label>
              <input
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Commercial"
              />
            </div>

            <div>
              <label htmlFor="growthScore" className="mb-2 block text-sm font-medium text-gray-300">
                Growth score (1-10)
              </label>
              <input id="growthScore" name="growthScore" type="number" min="1" max="10" value={form.growthScore} onChange={handleChange} required className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="propertyCategory" className="mb-2 block text-sm font-medium text-gray-300">Category</label>
              <select id="propertyCategory" name="propertyCategory" value={form.propertyCategory} onChange={handleChange} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3">
                {PROPERTY_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="riskLevel" className="mb-2 block text-sm font-medium text-gray-300">Risk</label>
              <select id="riskLevel" name="riskLevel" value={form.riskLevel} onChange={handleChange} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3">
                {RISK_LEVELS.map((risk) => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="legalStatus" className="mb-2 block text-sm font-medium text-gray-300">Legal status</label>
              <select id="legalStatus" name="legalStatus" value={form.legalStatus} onChange={handleChange} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3">
                <option value="verified">Verified</option>
                <option value="under_review">Under review</option>
              </select>
            </div>
            <div>
              <label htmlFor="constructionStatus" className="mb-2 block text-sm font-medium text-gray-300">Construction</label>
              <select id="constructionStatus" name="constructionStatus" value={form.constructionStatus} onChange={handleChange} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3">
                <option value="ready">Ready to move</option>
                <option value="under_construction">Under construction</option>
              </select>
            </div>
            <div>
              <label htmlFor="fundingDeadline" className="mb-2 block text-sm font-medium text-gray-300">Funding deadline</label>
              <input id="fundingDeadline" name="fundingDeadline" type="date" value={form.fundingDeadline} onChange={handleChange} required className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="fundedPercent" className="mb-2 block text-sm font-medium text-gray-300">Funded (%)</label>
              <input id="fundedPercent" name="fundedPercent" type="number" min="0" max="100" value={form.fundedPercent} onChange={handleChange} required className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProperty;
