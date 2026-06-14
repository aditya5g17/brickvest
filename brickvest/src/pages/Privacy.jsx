function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: May 2026</p>

        <div className="space-y-4 text-gray-300">
          <p>
            BrickVest stores account information (name, email) and investment records in
            Firebase Authentication and Cloud Firestore.
          </p>
          <p>
            Payment records include property details, share counts, and transaction status.
            Razorpay mode processes payments through Razorpay&apos;s secure checkout; we do not
            store card numbers on our servers.
          </p>
          <p>
            Demo sandbox mode stores simulated payment status in Firestore for your user
            account only.
          </p>
          <p>
            For a production deployment, you should add cookie consent, data export, and
            account deletion flows as required by applicable law.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
