import { useEffect, useState } from "react";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { collection, doc, getCountFromServer, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { db } from "../firebase/config";
import { demoVerifiedProperties } from "../data/demoProperties";
import { useAuth } from "../hooks/useAuth";
import { seedFundingFromPercent } from "../utils/propertyFunding";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    pendingReviews: 0,
    pendingKyc: 0,
    users: 0,
    investments: 0,
    totalInvested: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const [
          propertiesCount,
          pendingReviewsCount,
          pendingKycCount,
          usersCount,
          investmentsSnapshot,
        ] = await Promise.all([
          getCountFromServer(collection(db, "properties")),
          getCountFromServer(query(collection(db, "reviewQueue"), where("status", "==", "pending"))),
          getCountFromServer(query(collection(db, "users"), where("kycStatus", "==", "pending_review"))),
          getCountFromServer(collection(db, "users")),
          getDocs(collection(db, "investments")),
        ]);

        const investments = investmentsSnapshot.docs.map((investmentDoc) => investmentDoc.data());
        const totalInvested = investments.reduce(
          (sum, investment) => sum + (investment.totalInvestment || 0),
          0
        );

        if (isMounted) {
          setStats({
            properties: propertiesCount.data().count,
            pendingReviews: pendingReviewsCount.data().count,
            pendingKyc: pendingKycCount.data().count,
            users: usersCount.data().count,
            investments: investments.length,
            totalInvested,
          });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Could not load admin stats. Check Firestore rules and permissions.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    { label: "Verified Properties", value: stats.properties, tone: "text-blue-400" },
    { label: "Pending Reviews", value: stats.pendingReviews, tone: "text-yellow-300" },
    { label: "Pending KYC", value: stats.pendingKyc, tone: "text-orange-300" },
    { label: "Users", value: stats.users, tone: "text-green-400" },
    { label: "Investments", value: stats.investments, tone: "text-purple-300" },
  ];

  const platformChartData = {
    labels: ["Properties", "Reviews", "Users", "Investments"],
    datasets: [
      {
        label: "Platform Count",
        data: [stats.properties, stats.pendingReviews, stats.users, stats.investments],
        backgroundColor: ["#2563eb", "#ca8a04", "#16a34a", "#9333ea"],
        borderRadius: 6,
      },
    ],
  };

  const seedDemoProperties = async () => {
    if (!currentUser) return;

    setSeeding(true);
    setError("");
    setMessage("");

    try {
      await Promise.all(
        demoVerifiedProperties.map((property) => {
          const funding = seedFundingFromPercent(property);
          return setDoc(doc(db, "properties", property.id), {
            ...property,
            ...funding,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            seededDemo: true,
          });
        })
      );

      setStats((current) => ({
        ...current,
        properties: Math.max(current.properties, demoVerifiedProperties.length),
      }));
      setMessage("Demo verified properties seeded successfully.");
      toast.success("Demo properties seeded.");
    } catch (err) {
      console.error(err);
      setError("Could not seed demo properties. Check admin role or Firestore rules.");
    } finally {
      setSeeding(false);
    }
  };

  const promoteToAdmin = async (event) => {
    event.preventDefault();

    if (!promoteEmail.trim()) return;

    setPromoting(true);
    setError("");
    setMessage("");

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const target = usersSnapshot.docs.find(
        (userDoc) => userDoc.data().email?.toLowerCase() === promoteEmail.trim().toLowerCase()
      );

      if (!target) {
        setError("User email not found in Firestore users collection.");
        toast.error("User not found.");
        return;
      }

      await updateDoc(doc(db, "users", target.id), {
        role: "admin",
        promotedAt: serverTimestamp(),
      });

      setMessage(`${promoteEmail} has been promoted to admin.`);
      toast.success("User promoted to admin.");
      setPromoteEmail("");
    } catch (err) {
      console.error(err);
      setError("Could not promote user to admin.");
      toast.error("Promote failed.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
              Admin
            </p>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="mt-3 text-gray-400">
              Quick overview of platform listings, review queue, and investment activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/review-queue" className="rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-700">
              Review Queue
            </Link>
            <Link to="/admin/kyc-queue" className="rounded-lg border border-orange-500/50 px-4 py-3 font-semibold text-orange-200 hover:bg-orange-500/10">
              KYC Queue ({loading ? "…" : stats.pendingKyc})
            </Link>
            <Link to="/add-property" className="rounded-lg border border-gray-700 px-4 py-3 font-semibold hover:border-blue-500">
              Add Property
            </Link>
            <Link to="/admin/transactions" className="rounded-lg border border-gray-700 px-4 py-3 font-semibold hover:border-blue-500">
              Transactions
            </Link>
            <button
              type="button"
              onClick={seedDemoProperties}
              disabled={seeding}
              className="rounded-lg border border-green-500/50 px-4 py-3 font-semibold text-green-200 hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {seeding ? "Seeding..." : "Seed Demo Properties"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-100">
            {message}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className={`mt-3 text-3xl font-bold ${card.tone}`}>
                {loading ? "..." : card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Total platform investment volume</p>
          <p className="mt-3 text-4xl font-bold text-blue-400">
            {loading ? "..." : `Rs.${stats.totalInvested.toLocaleString()}`}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-2 text-xl font-semibold">Promote user to admin</h2>
          <p className="mb-4 text-sm text-gray-400">
            The first admin is set manually in Firestore. After that, you can create more admins here.
          </p>
          <form onSubmit={promoteToAdmin} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={promoteEmail}
              onChange={(event) => setPromoteEmail(event.target.value)}
              placeholder="user@email.com"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={promoting}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {promoting ? "Promoting..." : "Make Admin"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">Platform Overview</h2>
          <Bar
            data={platformChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { ticks: { color: "#d1d5db" }, grid: { color: "#1f2937" } },
                y: { ticks: { color: "#d1d5db" }, grid: { color: "#1f2937" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
