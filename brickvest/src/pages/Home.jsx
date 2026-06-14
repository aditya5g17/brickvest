import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import { db } from "../firebase/config";
import { normalizeProperty } from "../utils/propertyHelpers";

const STATS = [
  { value: "₹50 Cr+", label: "Assets Listed" },
  { value: "2,400+", label: "Active Investors" },
  { value: "8.2%", label: "Avg. Rental Yield" },
  { value: "45+", label: "Verified Properties" },
];

const STEPS = [
  {
    step: "01",
    title: "Browse & Select",
    description:
      "Explore institutionally vetted residential and commercial properties with transparent yields and funding progress.",
  },
  {
    step: "02",
    title: "Invest from ₹5,000",
    description:
      "Purchase fractional shares via secure checkout. Own a slice of premium real estate without full property cost.",
  },
  {
    step: "03",
    title: "Earn & Track",
    description:
      "Receive monthly rental income, monitor portfolio performance, and download ownership certificates from your dashboard.",
  },
];

const BENEFITS = [
  {
    icon: FiTrendingUp,
    title: "Institutional Quality",
    description: "Every listing passes legal verification, due diligence, and admin review before going live.",
  },
  {
    icon: FiBarChart2,
    title: "Transparent Returns",
    description: "Clear rental yield, growth scores, and funding timelines — no hidden fees in our demo platform.",
  },
  {
    icon: FiShield,
    title: "Aligned Interests",
    description: "Properties are structured for fractional ownership with capped investor limits per asset.",
  },
  {
    icon: FiUsers,
    title: "Built for Individuals",
    description: "Access the same asset class as institutions, starting with amounts as low as ₹5,000 per share.",
  },
];

const PROPERTY_TYPES = [
  {
    id: "residential",
    title: "Residential",
    description: "Premium apartments and homes in high-demand metros with stable rental occupancy.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "commercial",
    title: "Commercial",
    description: "Grade-A office and retail spaces offering stronger yields and longer lease tenures.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "mixed",
    title: "Mixed Use",
    description: "Diversified assets combining residential and commercial income streams in one investment.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const propertiesQuery = query(
          collection(db, "properties"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const snapshot = await getDocs(propertiesQuery);
        setFeatured(
          snapshot.docs.map((docSnap) =>
            normalizeProperty({ id: docSnap.id, ...docSnap.data() })
          )
        );
      } catch {
        setFeatured([]);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy)] text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy)] via-[var(--navy)]/95 to-[var(--navy)]/80" />

        <div className="page-container relative section-pad">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl"
          >
            <span className="badge badge-gold mb-6 inline-flex">
              Fractional Real Estate Platform
            </span>
            <h1 className="heading-display text-4xl text-white md:text-6xl lg:text-7xl">
              Institutional investing,{" "}
              <em className="text-[var(--gold-light)] not-italic">for everyone</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Own verified premium properties from ₹5,000. Earn passive rental income,
              track your portfolio, and invest alongside a growing community of fractional owners.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate("/marketplace")}
                className="btn btn-primary btn-lg"
              >
                Explore Properties
                <FiArrowRight />
              </button>
              <button
                type="button"
                onClick={() => navigate("/calculator")}
                className="btn btn-outline btn-lg !border-white/30 !text-white hover:!border-[var(--gold-light)] hover:!bg-white/10 hover:!text-[var(--gold-light)]"
              >
                Calculate Returns
              </button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
              {["SEBI-style disclosures", "Verified listings", "Monthly rent tracking"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <FiCheckCircle className="text-[var(--gold-light)]" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container">
          <div className="grid grid-cols-2 divide-x divide-[var(--border)] md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="stat-block py-8 md:py-10">
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured properties */}
      {featured.length > 0 && (
        <section className="section-pad bg-[var(--cream)]">
          <div className="page-container">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="divider-gold mb-4" />
                <h2 className="heading-section">Featured Opportunities</h2>
                <p className="mt-2 text-muted">
                  Hand-picked verified properties currently open for fractional investment.
                </p>
              </div>
              <Link to="/marketplace" className="btn btn-outline">
                View All Properties
                <FiArrowRight />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="section-pad bg-white">
        <div className="page-container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="divider-gold mx-auto mb-4" />
            <h2 className="heading-section">How BrickVest Works</h2>
            <p className="mt-3 text-muted">
              A simple three-step journey from browsing to earning rental income.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="card card-hover p-8">
                <span className="font-display text-5xl font-bold text-[var(--gold-pale)]">
                  {step.step}
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold text-[var(--navy)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-pad bg-[var(--cream)]">
        <div className="page-container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="divider-gold mb-4" />
              <h2 className="heading-section">
                Where investing meets{" "}
                <span className="text-[var(--gold)]">transparency</span>
              </h2>
              <p className="mt-4 text-muted leading-relaxed">
                Inspired by institutional real estate platforms, BrickVest brings due diligence,
                clear metrics, and portfolio tracking to individual fractional investors.
              </p>
              <Link to="/register" className="btn btn-primary mt-8">
                Create Free Account
                <FiArrowRight />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="card p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gold-pale)] text-[var(--gold)]">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-[var(--navy)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property types */}
      <section className="section-pad bg-white">
        <div className="page-container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="divider-gold mx-auto mb-4" />
            <h2 className="heading-section">Invest Across Asset Classes</h2>
            <p className="mt-3 text-muted">
              Residential, commercial, or mixed-use — diversify your fractional portfolio.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {PROPERTY_TYPES.map((type) => (
              <article key={type.id} className="card card-hover overflow-hidden">
                <img
                  src={type.image}
                  alt={type.title}
                  className="h-52 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="font-display text-2xl font-semibold text-[var(--navy)]">
                    {type.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{type.description}</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/marketplace?category=${type.id}`)}
                    className="btn btn-outline mt-5 w-full"
                  >
                    Browse {type.title}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--navy)] py-16 text-white">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Ready to build your real estate portfolio?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/65">
            Join thousands of investors who start with as little as ₹5,000 per share.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <Link
              to="/marketplace"
              className="btn btn-outline btn-lg !border-white/30 !text-white hover:!border-[var(--gold-light)] hover:!text-[var(--gold-light)]"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
