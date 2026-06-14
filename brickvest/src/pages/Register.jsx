
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      await register(form);
      toast.success("Account created!");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Could not create account. Check your email and password.");
      toast.error("Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Start fractional real estate investing on BrickVest in minutes."
      footer={
        <p>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-[var(--navy)] hover:text-[var(--gold)]">
            Sign in
          </Link>
        </p>
      }
    >
      {error && <div className="alert-error mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="label-field">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="input-field"
            placeholder="Your full name"
          />
        </div>

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
            placeholder="Minimum 6 characters"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        By registering, you agree to our{" "}
        <Link to="/terms" className="text-[var(--gold)] hover:underline">Terms</Link>
        {" "}and{" "}
        <Link to="/privacy" className="text-[var(--gold)] hover:underline">Privacy Policy</Link>.
      </p>
    </AuthLayout>
  );
}

export default Register;
