
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const riskLabels = { low: "Low", medium: "Medium", high: "High" };
const goalLabels = { income: "Monthly Income", growth: "Growth", balanced: "Balanced" };

function Profile() {
  const { currentUser, userProfile, isAdmin, isOnboardingComplete } = useAuth();

  return (
    <div className="bg-gray-950 text-white min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">
              {(currentUser?.displayName || currentUser?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {currentUser?.displayName || userProfile?.name || "BrickVest Investor"}
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isAdmin ? "bg-blue-500/10 text-blue-300" : "bg-gray-800 text-gray-300"}`}>
                  {isAdmin ? "Admin" : "Investor"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isOnboardingComplete
                      ? "bg-green-500/10 text-green-300"
                      : "bg-yellow-500/10 text-yellow-200"
                  }`}
                >
                  {isOnboardingComplete ? "Active" : "Setup Pending"}
                </span>
              </div>
              <p className="text-gray-400">{currentUser?.email}</p>
              {userProfile?.phone && (
                <p className="text-sm text-gray-400">Phone: {userProfile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {!isOnboardingComplete && !isAdmin && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <p className="mb-3 text-yellow-100">
              Your account is not complete yet. Finish onboarding before you invest.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
            >
              Continue Setup
            </Link>
          </div>
        )}

        {isOnboardingComplete && !isAdmin && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 text-lg font-semibold">Investor Profile</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">KYC</dt>
                <dd
                  className={`font-medium ${
                    userProfile?.kycStatus === "verified" || userProfile?.kycStatus === "verified_demo"
                      ? "text-green-300"
                      : userProfile?.kycStatus === "pending_review"
                        ? "text-yellow-200"
                        : userProfile?.kycStatus === "rejected"
                          ? "text-red-300"
                          : "text-gray-300"
                  }`}
                >
                  {userProfile?.kycStatus === "verified" || userProfile?.kycStatus === "verified_demo"
                    ? "Verified (demo)"
                    : userProfile?.kycStatus === "pending_review"
                      ? "Pending admin review"
                      : userProfile?.kycStatus === "rejected"
                        ? `Rejected${userProfile?.kycRejectReason ? `: ${userProfile.kycRejectReason}` : ""}`
                        : userProfile?.kycStatus || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Bank</dt>
                <dd className="font-medium">
                  {userProfile?.bankVerified
                    ? userProfile?.bankAccountMasked || "Linked"
                    : "Not linked"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Risk</dt>
                <dd className="font-medium">{riskLabels[userProfile?.riskProfile] || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Goal</dt>
                <dd className="font-medium">{goalLabels[userProfile?.investmentGoal] || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Preferred city</dt>
                <dd className="font-medium">{userProfile?.preferredCity || "Any"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Budget / share</dt>
                <dd className="font-medium">{userProfile?.budgetRange || "all"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Horizon</dt>
                <dd className="font-medium capitalize">{userProfile?.investmentHorizon || "medium"}</dd>
              </div>
            </dl>
            <Link
              to="/recommendations"
              className="mt-4 inline-flex text-sm text-blue-400 hover:text-blue-300"
            >
              View personalized recommendations →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
