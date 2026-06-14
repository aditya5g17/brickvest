import { useEffect, useMemo, useState } from "react";
import { calculateInvestmentTotal, calculateMonthlyRent } from "../utils/calculations";
import { PAYMENT_MODES } from "../constants/propertyMeta";
import {
  computeOwnershipPercent,
  getRemainingShares,
  getUserShareLimit,
  normalizeProperty,
  validateSharePurchase,
} from "../utils/propertyHelpers";
import { formatCurrency } from "../utils/format";

function InvestModal({
  property,
  isOpen,
  onClose,
  onConfirm,
  submitting,
  userSharesHeld = 0,
  paymentMode = "upi",
  onPaymentModeChange,
}) {
  const [shares, setShares] = useState(1);
  const normalized = useMemo(() => normalizeProperty(property), [property]);

  const sharePrice = normalized.sharePrice || 0;
  const rentalYield = normalized.rentalYield;
  const maxCanBuy = getUserShareLimit(property, userSharesHeld);
  const remaining = getRemainingShares(property);

  const summary = useMemo(() => {
    const totalInvestment = calculateInvestmentTotal(sharePrice, shares);
    const monthlyRent = calculateMonthlyRent(totalInvestment, rentalYield);
    const ownershipPercent = computeOwnershipPercent(
      userSharesHeld + shares,
      normalized.totalShares
    );

    return { totalInvestment, monthlyRent, ownershipPercent };
  }, [normalized.totalShares, rentalYield, sharePrice, shares, userSharesHeld]);

  useEffect(() => {
    if (isOpen) setShares(1);
  }, [isOpen, property?.id]);

  if (!isOpen) return null;

  const handleSharesChange = (event) => {
    const value = Math.max(1, Number(event.target.value) || 1);
    setShares(Math.min(value, maxCanBuy || value, remaining || value));
  };

  const handleConfirm = () => {
    const validation = validateSharePurchase(property, userSharesHeld, shares);
    if (!validation.ok) return;
    onConfirm({
      shares,
      totalInvestment: summary.totalInvestment,
      estimatedMonthlyRent: summary.monthlyRent,
      ownershipPercent: summary.ownershipPercent,
      paymentMode,
    });
  };

  const validation = validateSharePurchase(property, userSharesHeld, shares);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy)]/40 px-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--navy)]">Buy Shares</h2>
            <p className="mt-1 text-sm text-muted">{property?.title}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            ✕
          </button>
        </div>

        <div className="mb-5 rounded-lg bg-[var(--cream)] p-4 text-sm text-[var(--navy-mid)]">
          <p>Remaining shares: <strong>{remaining}</strong></p>
          <p>Max you can buy: <strong>{maxCanBuy}</strong> ({normalized.maxOwnershipPercent}% cap)</p>
          <p>You already own: <strong>{userSharesHeld}</strong> shares</p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="shares" className="label-field">Number of shares</label>
            <input
              id="shares"
              type="number"
              min="1"
              max={Math.min(maxCanBuy, remaining) || 1}
              value={shares}
              onChange={handleSharesChange}
              className="input-field"
            />
          </div>

          <div>
            <p className="label-field">Payment mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onPaymentModeChange?.(mode.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    paymentMode === mode.id
                      ? "border-[var(--gold)] bg-[var(--gold-pale)]"
                      : "border-[var(--border)] bg-white hover:border-[var(--gold)]"
                  }`}
                >
                  <p className="font-semibold text-[var(--navy)]">{mode.label}</p>
                  <p className="text-xs text-muted">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-lg bg-[var(--cream)] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Share price</p>
              <p className="font-semibold text-[var(--navy)]">{formatCurrency(sharePrice)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Total pay</p>
              <p className="font-semibold text-[var(--gold)]">{formatCurrency(summary.totalInvestment)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Your ownership</p>
              <p className="font-semibold text-[var(--navy)]">{summary.ownershipPercent}%</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Est. monthly rent</p>
              <p className="font-semibold text-[var(--success)]">{formatCurrency(Math.round(summary.monthlyRent))}</p>
            </div>
          </div>

          {!validation.ok && <p className="text-sm text-red-600">{validation.message}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !validation.ok}
              className="btn btn-primary"
            >
              {submitting ? "Processing..." : "Continue to Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvestModal;
