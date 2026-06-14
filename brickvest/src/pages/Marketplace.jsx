import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { FiFilter, FiSearch } from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import {
  BUDGET_BUCKETS,
  DURATION_FILTERS,
  PROPERTY_CATEGORIES,
  RISK_LEVELS,
  STATUS_FILTERS,
  YIELD_FILTERS,
} from "../constants/propertyMeta";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { fetchInvestorCountsForProperties } from "../utils/investorCounts";
import { extractCity, normalizeProperty, propertyMatchesFilters } from "../utils/propertyHelpers";

function Marketplace() {
  const { currentUser, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [investorCounts, setInvestorCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categoryFromUrl = searchParams.get("category");
  const initialCategory =
    categoryFromUrl && ["residential", "commercial", "mixed"].includes(categoryFromUrl)
      ? categoryFromUrl
      : "all";

  const [filters, setFilters] = useState({
    search: "",
    category: initialCategory,
    city: "All",
    budget: "all",
    yield: "all",
    risk: "all",
    propertyType: "all",
    status: "all",
    duration: "all",
    sortBy: "newest",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const propertiesSnapshot = await getDocs(collection(db, "properties"));
        const propertyList = propertiesSnapshot.docs.map((propertyDoc) =>
          normalizeProperty({ id: propertyDoc.id, ...propertyDoc.data() })
        );
        setProperties(propertyList);
        const counts = await fetchInvestorCountsForProperties(
          propertyList.map((property) => property.id)
        );
        setInvestorCounts(counts);
      } catch (err) {
        console.error(err);
        setError("Could not load properties. Check your Firebase configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cities = useMemo(
    () => ["All", ...new Set(properties.map((property) => property.city || extractCity(property.location)))],
    [properties]
  );

  const propertyTypes = useMemo(
    () => ["all", ...new Set(properties.map((property) => property.type).filter(Boolean))],
    [properties]
  );

  const filteredProperties = useMemo(() => {
    let list = properties.filter((property) => propertyMatchesFilters(property, filters, BUDGET_BUCKETS));

    list = [...list].sort((a, b) => {
      if (filters.sortBy === "price-low") return (a.price || 0) - (b.price || 0);
      if (filters.sortBy === "price-high") return (b.price || 0) - (a.price || 0);
      if (filters.sortBy === "yield") return (b.rentalYield || 0) - (a.rentalYield || 0);
      if (filters.sortBy === "funded") return (b.fundedPercent || 0) - (a.fundedPercent || 0);
      if (filters.sortBy === "growth") return (b.growthScore || 0) - (a.growthScore || 0);
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    });

    return list;
  }, [properties, filters]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="page-shell pb-16">
      {/* Page header */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container py-12 md:py-16">
          <div className="divider-gold mb-4" />
          <h1 className="heading-section">Verified Properties</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Browse institutionally reviewed residential, commercial, and mixed-use assets.
            Filter by yield, risk, budget, and funding status.
          </p>
        </div>
      </section>

      <div className="page-container py-10">
        {/* Category pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {PROPERTY_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFilter("category", category.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filters.category === category.id
                  ? "bg-[var(--navy)] text-white"
                  : "border border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Search & sort row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search by name or location..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filters.sortBy}
            onChange={(event) => setFilter("sortBy", event.target.value)}
            className="input-field select-field sm:w-48"
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="yield">Highest yield</option>
            <option value="growth">Growth score</option>
            <option value="funded">Most funded</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            className="btn btn-outline sm:w-auto"
          >
            <FiFilter />
            {showFilters ? "Hide Filters" : "More Filters"}
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="card mb-8 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label-field">City</label>
              <select
                value={filters.city}
                onChange={(event) => setFilter("city", event.target.value)}
                className="input-field select-field"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Budget</label>
              <select
                value={filters.budget}
                onChange={(event) => setFilter("budget", event.target.value)}
                className="input-field select-field"
              >
                {BUDGET_BUCKETS.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Yield</label>
              <select
                value={filters.yield}
                onChange={(event) => setFilter("yield", event.target.value)}
                className="input-field select-field"
              >
                {YIELD_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Risk</label>
              <select
                value={filters.risk}
                onChange={(event) => setFilter("risk", event.target.value)}
                className="input-field select-field"
              >
                <option value="all">Any risk</option>
                {RISK_LEVELS.map((risk) => (
                  <option key={risk} value={risk}>{risk} risk</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(event) => setFilter("propertyType", event.target.value)}
                className="input-field select-field"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>{type === "all" ? "All types" : type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Funding Status</label>
              <select
                value={filters.status}
                onChange={(event) => setFilter("status", event.target.value)}
                className="input-field select-field"
              >
                {STATUS_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Duration</label>
              <select
                value={filters.duration}
                onChange={(event) => setFilter("duration", event.target.value)}
                className="input-field select-field"
              >
                {DURATION_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <p className="mb-6 text-sm text-muted">
          Showing <strong className="text-[var(--navy)]">{filteredProperties.length}</strong> of{" "}
          {properties.length} properties
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--gold)]" />
          </div>
        ) : error ? (
          <div className="alert-error p-6 text-center">{error}</div>
        ) : properties.length === 0 ? (
          <div className="card p-12 text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--navy)]">No properties yet</h2>
            <p className="mt-2 text-muted">
              {isAdmin ? (
                <Link to="/add-property" className="font-semibold text-[var(--gold)] hover:underline">
                  Add the first property →
                </Link>
              ) : (
                "Properties will appear here once verified by our team."
              )}
            </p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-muted">No properties match your filters. Try adjusting your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                investorCount={investorCounts[property.id] ?? property.investorCount ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
