import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { db, functions } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import InvestModal from "../components/InvestModal";
import SandboxPaymentModal from "../components/SandboxPaymentModal";
const PropertyMap = lazy(() => import("../components/PropertyMap"));
import { loadRazorpayCheckout } from "../utils/razorpay";
import {
  fetchInvestorCountsForProperties,
  registerPropertyInvestor,
} from "../utils/investorCounts";
import { applyInvestmentFunding } from "../utils/propertyFunding";
import {
  buildInvestmentRecord,
  getDaysUntilDeadline,
  getFundingStatus,
  getRemainingShares,
  normalizeProperty,
  validateSharePurchase,
} from "../utils/propertyHelpers";

const useRazorpayCheckout = import.meta.env.VITE_PAYMENT_PROVIDER === "razorpay";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isOnboardingComplete } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [sandboxPayment, setSandboxPayment] = useState(null);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [userSharesHeld, setUserSharesHeld] = useState(0);
  const [investorCount, setInvestorCount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("upi");
  const [certificateId, setCertificateId] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setProperty(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const docSnap = await getDoc(doc(db, "properties", id));

        if (!docSnap.exists()) {
          setProperty(null);
          setInvestorCount(0);
          setUserSharesHeld(0);
          return;
        }

        const normalized = normalizeProperty({ id: docSnap.id, ...docSnap.data() });
        setProperty(normalized);

        const counts = await fetchInvestorCountsForProperties([normalized.id]);
        setInvestorCount(
          counts[normalized.id] ?? Number(normalized.investorCount) ?? 0
        );

        if (currentUser) {
          const userInvestmentsQuery = query(
            collection(db, "investments"),
            where("propertyId", "==", id),
            where("userId", "==", currentUser.uid)
          );
          const userSnap = await getDocs(userInvestmentsQuery);
          const ownedShares = userSnap.docs.reduce(
            (sum, investmentDoc) => sum + (Number(investmentDoc.data().shares) || 0),
            0
          );
          setUserSharesHeld(ownedShares);
        } else {
          setUserSharesHeld(0);
        }
      } catch (error) {
        console.error(error);
        setProperty(null);
        toast.error("Could not load property page.");
        setMessage("Property load error. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, currentUser?.uid]);

  const handleOpenInvestModal = () => {
    if (!property) return;

    if (!currentUser) {
      navigate("/login", { state: { from: { pathname: `/property/${property.id}` } } });
      return;
    }

    if (!isAdmin && !isOnboardingComplete) {
      toast.error("Please complete account setup first.");
      navigate("/onboarding");
      return;
    }

    setMessage("");
    setIsInvestModalOpen(true);
  };

  const handleInvest = async ({ shares, paymentMode: selectedMode }) => {
    if (!property || !currentUser) return;

    const validation = validateSharePurchase(property, userSharesHeld, shares);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    setInvesting(true);
    setMessage("");
    setCertificateId("");

    if (!useRazorpayCheckout) {
      await startSandboxPayment(shares, selectedMode || paymentMode);
      return;
    }

    try {
      await loadRazorpayCheckout();

      const createPaymentOrder = httpsCallable(functions, "createPaymentOrder");
      const verifyPayment = httpsCallable(functions, "verifyPayment");
      const orderResponse = await createPaymentOrder({
        propertyId: property.id,
        shares,
      });

      const order = orderResponse.data;

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "BrickVest",
        description: `Investment in ${order.propertyTitle}`,
        order_id: order.orderId,
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
        },
        notes: {
          propertyId: property.id,
          shares: String(shares),
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response) => {
          try {
            await verifyPayment({
              paymentId: order.paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const refreshed = await getDoc(doc(db, "properties", property.id));
            if (refreshed.exists()) {
              setProperty({ id: refreshed.id, ...refreshed.data() });
            }

            toast.success("Investment successful!");
            setMessage("Payment verified. Investment successful.");
            setIsInvestModalOpen(false);
          } catch (error) {
            console.error(error);
            toast.error("Payment verification failed.");
            setMessage("Payment verification failed. Contact support with your payment id.");
          } finally {
            setInvesting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setInvesting(false);
            setMessage("Payment cancelled.");
            toast.error("Payment cancelled.");
          },
        },
      });

      checkout.open();
    } catch (error) {
      console.error(error);
      toast.error("Payment start failed.");
      setMessage("Payment could not be started. Check Razorpay setup and try again.");
      setInvesting(false);
    }
  };

  const startSandboxPayment = async (shares, selectedPaymentMode) => {
    try {
      const amount = Number(property.sharePrice || 0) * Number(shares);
      const estimatedMonthlyRent =
        (amount * (Number(property.rentalYield || property.expectedReturn || 6) / 100)) / 12;

      const paymentRef = await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        propertyId: property.id,
        propertyTitle: property.title,
        sharePrice: Number(property.sharePrice || 0),
        shares,
        amount,
        estimatedMonthlyRent,
        paymentMode: selectedPaymentMode || "upi",
        provider: "brickvest_sandbox",
        status: "otp_pending",
        createdAt: serverTimestamp(),
      });

      setSandboxPayment({
        paymentId: paymentRef.id,
        amount,
        currency: "INR",
        propertyTitle: property.title,
        maskedAccount: "BrickVest Sandbox Bank **** 2042",
        shares,
        estimatedMonthlyRent,
        paymentMode: selectedPaymentMode || "upi",
      });
      setIsInvestModalOpen(false);
      setIsSandboxModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Sandbox payment failed.");
      setMessage("Sandbox payment could not be started. Check Firestore rules.");
    } finally {
      setInvesting(false);
    }
  };

  const handleSandboxVerify = async (otp) => {
    if (!sandboxPayment || !property || !currentUser) return;

    const normalizedOtp = String(otp || "").trim();
    const newInvestor = userSharesHeld === 0;

    setInvesting(true);
    setMessage("");

    if (normalizedOtp !== "123456") {
      toast.error("Invalid OTP. Demo OTP is 123456.");
      setMessage("Invalid OTP. Use 123456 for sandbox payments.");
      setInvesting(false);
      return;
    }

    try {
      await updateDoc(doc(db, "payments", sandboxPayment.paymentId), {
        status: "paid",
        paidAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Payment update failed:", error);
      toast.error("Payment update failed. Deploy Firestore rules.");
      setMessage("Payment could not be verified. Run npm run deploy:rules.");
      setInvesting(false);
      return;
    }

    try {
      const investmentPayload = buildInvestmentRecord(property, {
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        propertyId: property.id,
        propertyTitle: property.title,
        sharePrice: Number(property.sharePrice || 0),
        shares: sandboxPayment.shares,
        totalInvestment: sandboxPayment.amount,
        estimatedMonthlyRent: sandboxPayment.estimatedMonthlyRent,
        paymentId: sandboxPayment.paymentId,
        paymentProvider: "brickvest_sandbox",
        paymentMode: sandboxPayment.paymentMode || "upi",
        paymentStatus: "paid",
        status: "active",
        createdAt: serverTimestamp(),
      });

      const investmentRef = await addDoc(collection(db, "investments"), investmentPayload);
      setCertificateId(investmentRef.id);
      setUserSharesHeld((current) => current + sandboxPayment.shares);
      if (newInvestor) {
        await registerPropertyInvestor(property.id, currentUser.uid);
        setInvestorCount((current) => current + 1);
      }
    } catch (error) {
      console.error("Investment create failed:", error);
      toast.error("Could not create investment record.");
      setMessage("Investment save failed. Check Firebase permissions.");
      setInvesting(false);
      return;
    }

    try {
      const freshSnap = await getDoc(doc(db, "properties", property.id));
      const freshProperty = freshSnap.exists()
        ? normalizeProperty({ id: freshSnap.id, ...freshSnap.data() })
        : property;

      const funding = await applyInvestmentFunding(
        property.id,
        freshProperty,
        sandboxPayment.shares,
        { isNewInvestor: newInvestor }
      );

      setProperty((current) => ({
        ...current,
        ...funding,
      }));
    } catch (error) {
      console.error("Funding update failed:", error);
      toast.error("Invested, but funded % update failed.");
      setMessage("Investment saved. Property funding % update failed — contact an admin.");
      setIsSandboxModalOpen(false);
      setSandboxPayment(null);
      setInvesting(false);
      return;
    }

    toast.success("Investment successful!");
    setMessage("Sandbox payment verified. Investment successful.");
    toast.success("Certificate ready!", { duration: 5000 });
    setIsSandboxModalOpen(false);
    setSandboxPayment(null);
    setInvesting(false);
  };

  const handleDeleteProperty = async () => {
    if (!property || !isAdmin) return;

    const shouldDelete = window.confirm("Delete this verified property? This cannot be undone.");
    if (!shouldDelete) return;

    setDeleting(true);
    setMessage("");

    try {
      await deleteDoc(doc(db, "properties", property.id));
      toast.success("Property deleted.");
      navigate("/marketplace");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
      setMessage("Could not delete property. Check Firebase permissions.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--gold)]" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="page-shell page-container py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-[var(--navy)]">Property not found</h1>
        <Link to="/marketplace" className="btn btn-primary mt-6">Back to Marketplace</Link>
      </div>
    );
  }

  const normalized = normalizeProperty(property);
  const fundingStatus = getFundingStatus(property);
  const daysLeft = getDaysUntilDeadline(property);
  const remainingShares = getRemainingShares(property);
  const canInvest = fundingStatus === "open" && remainingShares > 0;

  return (
    <div className="page-shell pb-16">
      <div className="page-container py-8 md:py-12">
        <Link to="/marketplace" className="mb-6 inline-flex text-sm font-medium text-muted no-underline hover:text-[var(--navy)]">
          ← Back to Properties
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="h-72 w-full object-cover md:h-96"
              />
              <div className="p-6 md:p-8">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="badge badge-navy capitalize">{normalized.propertyCategory}</span>
                  <span className="badge badge-gold capitalize">{fundingStatus === "open" ? "Funding Open" : fundingStatus}</span>
                  <span className="badge badge-navy">{property.type}</span>
                </div>

                <h1 className="font-display text-3xl font-semibold text-[var(--navy)] md:text-4xl">
                  {property.title}
                </h1>
                <p className="mt-2 text-muted">{property.location}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Rental Yield", value: `${normalized.rentalYield}% p.a.`, highlight: true },
                    { label: "Growth Score", value: `${normalized.growthScore}/10` },
                    { label: "Risk Level", value: normalized.riskLevel, capitalize: true },
                    { label: "Legal Status", value: normalized.legalStatus, capitalize: true },
                    { label: "Construction", value: normalized.constructionStatus, capitalize: true },
                    { label: "Investors", value: investorCount },
                    { label: "Total Shares", value: normalized.totalShares },
                    { label: "Remaining", value: remainingShares },
                    { label: "Deadline", value: daysLeft != null ? `${daysLeft} days left` : "Not set" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-[var(--cream)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
                      <p className={`mt-1 font-semibold capitalize ${item.highlight ? "text-[var(--success)]" : "text-[var(--navy)]"}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <div className="mb-2 flex justify-between text-sm font-medium text-muted">
                    <span>{normalized.fundedPercent}% funded</span>
                    <span>Max {normalized.maxOwnershipPercent}% per investor</span>
                  </div>
                  <div className="progress-track h-3">
                    <div className="progress-fill" style={{ width: `${normalized.fundedPercent}%` }} />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-display text-xl font-semibold text-[var(--navy)]">Location</h3>
                  <Suspense
                    fallback={
                      <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--cream)] text-muted">
                        Loading map...
                      </div>
                    }
                  >
                    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
                      <PropertyMap property={property} />
                    </div>
                  </Suspense>
                </div>

                {isAdmin && (
                  <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
                    <Link to={`/property/${property.id}/edit`} className="btn btn-outline">
                      Edit Property
                    </Link>
                    <button
                      type="button"
                      onClick={handleDeleteProperty}
                      disabled={deleting}
                      className="btn btn-outline !border-red-300 !text-red-600 hover:!bg-red-50"
                    >
                      {deleting ? "Deleting..." : "Delete Property"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invest sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Investment Summary</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--navy)]">
                {property?.sharePrice != null ? `₹${property.sharePrice.toLocaleString()}` : "—"}
              </p>
              <p className="text-sm text-muted">per fractional share</p>

              <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total asset value</span>
                  <span className="font-semibold">₹{property?.price?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Min. investment</span>
                  <span className="font-semibold text-[var(--gold)]">₹{property?.sharePrice?.toLocaleString() || "5,000"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Est. yield</span>
                  <span className="font-semibold text-[var(--success)]">{normalized.rentalYield}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Your shares</span>
                  <span className="font-semibold">{userSharesHeld}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenInvestModal}
                disabled={!canInvest}
                className="btn btn-primary mt-8 w-full"
              >
                {canInvest ? "Invest Now" : "Funding Closed"}
              </button>

              {!canInvest && (
                <p className="mt-3 text-center text-xs text-muted">
                  This property is fully funded or past its deadline.
                </p>
              )}

              {message && (
                <p className="mt-4 rounded-lg bg-[var(--cream)] p-3 text-sm text-[var(--navy-mid)]">{message}</p>
              )}

              {certificateId && (
                <Link
                  to={`/certificate/${certificateId}`}
                  className="btn btn-outline mt-4 w-full !border-[var(--success)] !text-[var(--success)]"
                >
                  View Ownership Certificate
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <InvestModal
        property={property}
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        onConfirm={handleInvest}
        submitting={investing}
        userSharesHeld={userSharesHeld}
        paymentMode={paymentMode}
        onPaymentModeChange={setPaymentMode}
      />

      <SandboxPaymentModal
        payment={sandboxPayment}
        isOpen={isSandboxModalOpen}
        onClose={() => {
          setIsSandboxModalOpen(false);
          setSandboxPayment(null);
          setMessage("Sandbox payment cancelled.");
        }}
        onVerify={handleSandboxVerify}
        submitting={investing}
      />
    </div>
  );
}

export default PropertyDetail;
