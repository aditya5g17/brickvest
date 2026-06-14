
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Incorrect email or password. Please try again.");
      toast.error("Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!form.email) {
      setError("Enter your email first to reset your password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await resetPassword(form.email);
      toast.success("Password reset link sent to your email.");
      setShowReset(false);
    } catch (err) {
      console.error(err);
      setError("Could not send reset email. Check your email address.");
      toast.error("Reset failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={showReset ? "Reset Password" : "Welcome Back"}
      subtitle={
        showReset
          ? "We'll send a password reset link to your registered email."
          : "Sign in to access your portfolio and investments."
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setShowReset((current) => !current);
              setError("");
            }}
            className="font-medium text-[var(--gold)] hover:underline"
          >
            {showReset ? "Back to login" : "Forgot password?"}
          </button>
          {!showReset && (
            <p className="mt-3">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-[var(--navy)] hover:text-[var(--gold)]">
                Create one free
              </Link>
            </p>
          )}
        </>
      }
    >
      {error && <div className="alert-error mb-5">{error}</div>}

      <form onSubmit={showReset ? handleResetPassword : handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label-field">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        {!showReset && (
          <div>
            <label htmlFor="password" className="label-field">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="input-field"
              placeholder="Your password"
            />
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting
            ? showReset
              ? "Sending..."
              : "Signing in..."
            : showReset
              ? "Send Reset Link"
              : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
