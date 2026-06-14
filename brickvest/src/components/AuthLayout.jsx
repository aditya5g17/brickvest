import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="page-shell flex min-h-[calc(100vh-4.25rem)]">
      <div className="hidden w-1/2 flex-col justify-between bg-[var(--navy)] p-12 text-white lg:flex">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-[var(--gold-light)]">
              BV
            </span>
            <span className="font-display text-2xl font-semibold text-white">
              Brick<span className="text-[var(--gold-light)]">Vest</span>
            </span>
          </Link>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Invest in premium real estate from ₹5,000
          </h2>
          <p className="mt-4 max-w-md text-white/65 leading-relaxed">
            Join a platform built for transparent fractional ownership — verified listings,
            portfolio tracking, and monthly rental income simulation.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/55">
            <li>✦ Verified property marketplace</li>
            <li>✦ Sandbox & Razorpay payment modes</li>
            <li>✦ Dashboard, portfolio & certificates</li>
          </ul>
        </div>
        <p className="text-xs text-white/35">
          Demo platform — not SEBI registered.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-[var(--navy)] lg:hidden"
          >
            <FiArrowLeft />
            Back to home
          </Link>

          <div className="card p-8 md:p-10">
            <h1 className="font-display text-3xl font-semibold text-[var(--navy)]">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
