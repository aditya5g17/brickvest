import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";

const FOOTER_LINKS = {
  Invest: [
    { to: "/marketplace", label: "Verified Properties" },
    { to: "/market-feed", label: "Market Feed" },
    { to: "/calculator", label: "Returns Calculator" },
    { to: "/recommendations", label: "Smart Match" },
  ],
  Platform: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/payments", label: "Payment History" },
    { to: "/onboarding", label: "Account Setup" },
  ],
  Legal: [
    { to: "/terms", label: "Terms of Use" },
    { to: "/privacy", label: "Privacy Policy" },
  ],
};

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--navy)] text-white">
      <div className="page-container section-pad !pb-12 !pt-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 no-underline">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-[var(--gold-light)]">
                BV
              </span>
              <span className="font-display text-2xl font-semibold text-white">
                Brick<span className="text-[var(--gold-light)]">Vest</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
              Institutional-grade fractional real estate investing for individual investors.
              Own premium assets, earn rental income, and track your portfolio — all in one place.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/55">
              <p className="flex items-center gap-2">
                <FiMapPin className="shrink-0 text-[var(--gold-light)]" />
                Gurugram, Haryana, India
              </p>
              <p className="flex items-center gap-2">
                <FiMail className="shrink-0 text-[var(--gold-light)]" />
                hello@brickvest.in
              </p>
              <p className="flex items-center gap-2">
                <FiPhone className="shrink-0 text-[var(--gold-light)]" />
                +91 98765 43210
              </p>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--gold-light)]">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 no-underline transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/45">
            © 2026 BrickVest. All rights reserved.
          </p>
          <p className="max-w-lg text-center text-xs leading-relaxed text-white/40 md:text-right">
            Demo platform — not SEBI registered. Listings and returns are illustrative.
            Not financial advice. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
