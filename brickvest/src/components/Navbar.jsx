import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { currentUser, isAdmin, isOnboardingComplete, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link-active" : ""}`;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const investorLinks = (
    <>
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to="/recommendations" className={linkClass}>For You</NavLink>
      <NavLink to="/portfolio" className={linkClass}>Portfolio</NavLink>
      <NavLink to="/payments" className={linkClass}>Payments</NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin" className={linkClass}>Admin</NavLink>
      <NavLink to="/review-queue" className={linkClass}>Review</NavLink>
      <NavLink to="/admin/kyc-queue" className={linkClass}>KYC</NavLink>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-[var(--border)] bg-white/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
          : "border-transparent bg-white"
      }`}
    >
      <div className="page-container flex h-[4.25rem] items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--navy)] text-sm font-bold text-[var(--gold-light)]">
            BV
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-[var(--navy)]">
            Brick<span className="text-[var(--gold)]">Vest</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/marketplace" className={linkClass}>Invest</NavLink>
          <NavLink to="/market-feed" className={linkClass}>Market Feed</NavLink>
          <NavLink to="/calculator" className={linkClass}>Calculator</NavLink>
          {currentUser && !isOnboardingComplete && !isAdmin && (
            <NavLink to="/onboarding" className="text-sm font-semibold text-[var(--gold)]">
              Complete Setup
            </NavLink>
          )}
          {currentUser && (isOnboardingComplete || isAdmin) && investorLinks}
          {currentUser && isAdmin && adminLinks}
          {currentUser && (
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {currentUser && (isOnboardingComplete || isAdmin) && <NotificationBell />}
          {currentUser ? (
            <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Start Investing</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--navy)] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-white px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-4">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/marketplace" className={linkClass}>Invest</NavLink>
            <NavLink to="/market-feed" className={linkClass}>Market Feed</NavLink>
            <NavLink to="/calculator" className={linkClass}>Calculator</NavLink>
            {currentUser && !isOnboardingComplete && !isAdmin && (
              <NavLink to="/onboarding" className="font-semibold text-[var(--gold)]">
                Complete Setup
              </NavLink>
            )}
            {currentUser && (isOnboardingComplete || isAdmin) && investorLinks}
            {currentUser && isAdmin && adminLinks}
            {currentUser && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              {currentUser ? (
                <button type="button" onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline">Sign In</Link>
                  <Link to="/register" className="btn btn-primary">Start Investing</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
