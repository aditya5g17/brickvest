import { useState } from "react";
import { formatCurrency } from "../utils/format";

function SandboxPaymentModal({ payment, isOpen, onClose, onVerify, submitting }) {
  const [otp, setOtp] = useState("");

  if (!isOpen || !payment) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onVerify(otp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy)]/40 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 md:p-8">
        <div className="mb-6">
          <span className="badge badge-gold">Sandbox Payment</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--navy)]">Verify Payment</h2>
          <p className="mt-2 text-sm text-muted">
            Simulated bank OTP for demo. Use <strong>123456</strong> to complete.
          </p>
        </div>

        <div className="mb-5 rounded-lg bg-[var(--cream)] p-4">
          <p className="text-xs font-semibold uppercase text-muted">Property</p>
          <p className="font-semibold text-[var(--navy)]">{payment.propertyTitle}</p>
          <p className="mt-3 text-xs font-semibold uppercase text-muted">Amount</p>
          <p className="text-xl font-bold text-[var(--gold)]">{formatCurrency(payment.amount)}</p>
          <p className="mt-3 text-xs font-semibold uppercase text-muted">Account</p>
          <p className="font-medium text-[var(--navy-mid)]">{payment.maskedAccount}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sandbox-otp" className="label-field">Enter OTP</label>
            <input
              id="sandbox-otp"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              inputMode="numeric"
              maxLength={6}
              className="input-field text-center text-lg tracking-widest"
              placeholder="123456"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Verifying..." : "Verify & Invest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SandboxPaymentModal;
