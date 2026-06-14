import { Link } from "react-router-dom";
import {
  getDaysUntilDeadline,
  getFundingStatus,
  normalizeProperty,
} from "../utils/propertyHelpers";
import { formatCurrency } from "../utils/format";

const riskStyles = {
  low: "badge-success",
  medium: "badge-gold",
  high: "bg-red-50 text-red-700",
};

const statusLabels = {
  open: "Funding Open",
  funded: "Fully Funded",
  closed: "Closed",
};

const statusStyles = {
  open: "badge-open",
  funded: "badge-success",
  closed: "badge-navy",
};

function PropertyCard({ property, investorCount = 0 }) {
  const normalized = normalizeProperty(property);
  const fundingStatus = getFundingStatus(property);
  const daysLeft = getDaysUntilDeadline(property);

  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <div className="relative">
        <img
          src={property?.image}
          alt={property?.title}
          className="h-56 w-full object-cover"
        />
        <span className="badge badge-navy absolute left-4 top-4 capitalize backdrop-blur-sm">
          {normalized.propertyCategory}
        </span>
        <span
          className={`badge absolute right-4 top-4 ${statusStyles[fundingStatus] || "badge-navy"}`}
        >
          {statusLabels[fundingStatus]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-display text-xl font-semibold leading-snug text-[var(--navy)]">
          {property?.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{property?.location}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--cream)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Value</p>
            <p className="mt-1 font-semibold text-[var(--navy)]">
              {formatCurrency(property?.price || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--cream)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Share Price</p>
            <p className="mt-1 font-semibold text-[var(--gold)]">
              {formatCurrency(property?.sharePrice || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--cream)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yield</p>
            <p className="mt-1 font-semibold text-[var(--success)]">
              {normalized.rentalYield}% p.a.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--cream)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Growth</p>
            <p className="mt-1 font-semibold text-[var(--navy)]">
              {normalized.growthScore}/10
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`badge capitalize ${riskStyles[normalized.riskLevel] || riskStyles.medium}`}>
            {normalized.riskLevel} risk
          </span>
          <span className="badge badge-navy">
            {normalized.legalStatus === "verified" ? "Verified" : "Under Review"}
          </span>
          <span className="badge badge-navy">{investorCount} investors</span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted">
            <span>{normalized.fundedPercent}% funded</span>
            {daysLeft != null && <span>{daysLeft} days left</span>}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${normalized.fundedPercent}%` }}
            />
          </div>
        </div>

        {property?.id ? (
          <Link to={`/property/${property.id}`} className="btn btn-navy mt-6 w-full">
            View Investment
          </Link>
        ) : (
          <span className="btn btn-outline mt-6 w-full cursor-not-allowed opacity-50">
            Unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export default PropertyCard;
