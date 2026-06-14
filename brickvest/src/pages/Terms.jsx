function Terms() {
  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl prose prose-invert">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-400 mb-6">Last updated: May 2026</p>

        <div className="space-y-4 text-gray-300">
          <p>
            BrickVest is a demonstration platform for fractional real estate investing.
            It is not registered with SEBI or any regulatory authority in India.
          </p>
          <p>
            Listings, yields, and rental projections are illustrative unless explicitly
            verified by licensed partners. Do not treat this app as financial advice.
          </p>
          <p>
            Sandbox payments simulate bank OTP flows for educational purposes only.
            Real money movement requires Razorpay production setup and legal compliance.
          </p>
          <p>
            By using BrickVest you agree to use the platform responsibly and accept that
            investment outcomes shown in demos are not guaranteed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;
