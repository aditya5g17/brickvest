import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import {
  GOAL_OPTIONS,
  maskAadhaar,
  maskBankAccount,
  maskPan,
  ONBOARDING_STEPS,
  RISK_OPTIONS,
  BUDGET_OPTIONS,
  CITY_OPTIONS,
  HORIZON_OPTIONS,
} from "../constants/onboarding";

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, userProfile, isAdmin, isOnboardingComplete, refreshUserProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    aadhaar: "",
    pan: "",
    selfieFileName: "",
    bankHolderName: "",
    bankAccount: "",
    bankIfsc: "",
    riskProfile: "",
    investmentGoal: "",
    preferredCity: "Any",
    budgetRange: "all",
    investmentHorizon: "medium",
  });

  useEffect(() => {
    if (isAdmin || isOnboardingComplete) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (userProfile) {
      setStep(Number(userProfile.onboardingStep) || 0);
      setForm((current) => ({
        ...current,
        name: userProfile.name || currentUser?.displayName || "",
        phone: userProfile.phone || "",
        dob: userProfile.dob || "",
        bankHolderName: userProfile.bankHolderName || userProfile.name || "",
        bankIfsc: userProfile.bankIfsc || "",
        riskProfile: userProfile.riskProfile || "",
        investmentGoal: userProfile.investmentGoal || "",
        preferredCity: userProfile.preferredCity || "Any",
        budgetRange: userProfile.budgetRange || "all",
        investmentHorizon: userProfile.investmentHorizon || "medium",
      }));
    }
  }, [userProfile, isAdmin, isOnboardingComplete, currentUser, navigate]);

  const progressPercent = useMemo(
    () => Math.round(((step + 1) / ONBOARDING_STEPS.length) * 100),
    [step]
  );

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "selfie" && files?.[0]) {
      setForm((current) => ({
        ...current,
        selfieFileName: files[0].name,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveProfile = async (payload) => {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        email: currentUser.email || userProfile?.email || "",
        role: userProfile?.role || "user",
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await refreshUserProfile();
  };

  const runMockVerify = async (message) => {
    setVerifying(true);
    await delay(1400);
    setVerifying(false);
    toast.success(message);
  };

  const goNext = async () => {
    setSaving(true);

    try {
      if (step === 0) {
        if (!form.phone.trim() || !form.dob) {
          toast.error("Phone and date of birth are required.");
          return;
        }

        await saveProfile({
          name: form.name.trim() || userProfile?.name,
          phone: form.phone.trim(),
          dob: form.dob,
          onboardingStep: 1,
        });
        setStep(1);
        return;
      }

      if (step === 1) {
        if (form.aadhaar.replace(/\D/g, "").length !== 12) {
          toast.error("Aadhaar must be 12 digits.");
          return;
        }
        if (form.pan.length < 10) {
          toast.error("Enter a valid PAN format.");
          return;
        }
        if (!form.selfieFileName) {
          toast.error("Upload a selfie (demo).");
          return;
        }

        await runMockVerify("KYC demo verified (DigiLocker mock)");

        await saveProfile({
          aadhaarMasked: maskAadhaar(form.aadhaar),
          panMasked: maskPan(form.pan),
          selfieUploaded: true,
          kycStatus: "pending_review",
          kycSubmittedAt: serverTimestamp(),
          onboardingStep: 2,
        });
        setStep(2);
        return;
      }

      if (step === 2) {
        if (!form.bankHolderName.trim() || form.bankAccount.replace(/\D/g, "").length < 9) {
          toast.error("Complete all bank details.");
          return;
        }
        if (form.bankIfsc.length < 11) {
          toast.error("Enter a valid IFSC code.");
          return;
        }

        await runMockVerify("Bank linked (penny drop demo)");

        await saveProfile({
          bankHolderName: form.bankHolderName.trim(),
          bankAccountMasked: maskBankAccount(form.bankAccount),
          bankIfsc: form.bankIfsc.toUpperCase(),
          bankVerified: true,
          onboardingStep: 3,
        });
        setStep(3);
        return;
      }

      if (step === 3) {
        if (!form.riskProfile) {
          toast.error("Select a risk level.");
          return;
        }

        await saveProfile({
          riskProfile: form.riskProfile,
          onboardingStep: 4,
        });
        setStep(4);
        return;
      }

      if (step === 4) {
        if (!form.investmentGoal) {
          toast.error("Select an investment goal.");
          return;
        }

        await saveProfile({
          investmentGoal: form.investmentGoal,
          preferredCity: form.preferredCity,
          budgetRange: form.budgetRange,
          investmentHorizon: form.investmentHorizon,
          onboardingStep: 5,
        });
        setStep(5);
      }
    } catch (error) {
      console.error(error);
      const hint =
        error?.code === "permission-denied"
          ? "Permission error — run npm run deploy:rules in the terminal."
          : error?.message || "Unknown error";
      toast.error(`Save failed: ${hint}`);
    } finally {
      setSaving(false);
    }
  };

  const activateAccount = async () => {
    setSaving(true);

    try {
      await saveProfile({
        onboardingComplete: true,
        accountStatus: "active",
        onboardingStep: ONBOARDING_STEPS.length,
        activatedAt: serverTimestamp(),
      });

      toast.success("Account activated! You can now invest.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Activation failed.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((current) => current - 1);
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
          Account Setup
        </p>
        <h1 className="text-3xl font-bold">Investor Onboarding</h1>
        <p className="mt-2 text-gray-400">
          This is demo KYC — real DigiLocker and bank APIs will be integrated in production.
        </p>

        <div className="mt-8 mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-400">
            <span>
              Step {step + 1} / {ONBOARDING_STEPS.length}: {ONBOARDING_STEPS[step].title}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-xl font-semibold">{ONBOARDING_STEPS[step].title}</h2>
          <p className="mb-6 text-sm text-gray-400">{ONBOARDING_STEPS[step].subtitle}</p>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Email</label>
                <input
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Date of birth</label>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                Demo: no real API calls. The Verify button runs a simulated check.
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Aadhaar number</label>
                <input
                  name="aadhaar"
                  value={form.aadhaar}
                  onChange={handleChange}
                  placeholder="12 digits"
                  maxLength={12}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">PAN</label>
                <input
                  name="pan"
                  value={form.pan}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 uppercase outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Selfie (demo upload)</label>
                <input
                  name="selfie"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full text-sm text-gray-300"
                />
                {form.selfieFileName && (
                  <p className="mt-2 text-sm text-green-300">Uploaded: {form.selfieFileName}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Account holder name</label>
                <input
                  name="bankHolderName"
                  value={form.bankHolderName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Account number</label>
                <input
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={handleChange}
                  placeholder="Demo account number"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">IFSC</label>
                <input
                  name="bankIfsc"
                  value={form.bankIfsc}
                  onChange={handleChange}
                  placeholder="SBIN0001234"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 uppercase outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {RISK_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                    form.riskProfile === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-950"
                  }`}
                >
                  <input
                    type="radio"
                    name="riskProfile"
                    value={option.value}
                    checked={form.riskProfile === option.value}
                    onChange={handleChange}
                  />
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-300">Investment goal</p>
              {GOAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                    form.investmentGoal === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-950"
                  }`}
                >
                  <input
                    type="radio"
                    name="investmentGoal"
                    value={option.value}
                    checked={form.investmentGoal === option.value}
                    onChange={handleChange}
                  />
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </label>
              ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="preferredCity" className="mb-2 block text-sm text-gray-300">
                    Preferred city
                  </label>
                  <select
                    id="preferredCity"
                    name="preferredCity"
                    value={form.preferredCity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3"
                  >
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="budgetRange" className="mb-2 block text-sm text-gray-300">
                    Budget per share
                  </label>
                  <select
                    id="budgetRange"
                    name="budgetRange"
                    value={form.budgetRange}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3"
                  >
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="investmentHorizon" className="mb-2 block text-sm text-gray-300">
                    Time horizon
                  </label>
                  <select
                    id="investmentHorizon"
                    name="investmentHorizon"
                    value={form.investmentHorizon}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3"
                  >
                    {HORIZON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-sm text-gray-300">
              <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-100">
                All steps complete! Click Activate to open your Dashboard.
              </p>
              <ul className="space-y-2">
                <li>KYC: Demo verified</li>
                <li>Bank: {form.bankHolderName || "Linked"}</li>
                <li>Risk: {form.riskProfile || userProfile?.riskProfile || "—"}</li>
                <li>Goal: {form.investmentGoal || userProfile?.investmentGoal || "—"}</li>
                <li>City: {form.preferredCity || "Any"}</li>
                <li>Budget: {form.budgetRange}</li>
                <li>Horizon: {form.investmentHorizon}</li>
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || saving || verifying}
              className="rounded-lg border border-gray-700 px-5 py-3 disabled:opacity-40"
            >
              Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={saving || verifying}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {verifying ? "Verifying..." : saving ? "Saving..." : "Continue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={activateAccount}
                disabled={saving}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Activating..." : "Activate Account"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
