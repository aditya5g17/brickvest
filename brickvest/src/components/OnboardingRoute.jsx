import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function OnboardingRoute({ children }) {
  const { currentUser, loading, isAdmin, isOnboardingComplete } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin || isOnboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default OnboardingRoute;
