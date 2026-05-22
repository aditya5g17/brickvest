import React from "react";

function Home() {
  return (
    <div className="text-white">

      {/* Hero Section */}
      <section className="text-center py-24 bg-gradient-to-r from-gray-900 to-gray-800">
        <h1 className="text-5xl font-bold mb-6">
          Invest in Real Estate <span className="text-blue-500">Starting ₹5,000</span>
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Own fractional shares of premium properties and earn passive rental income.
        </p>

        <button className="bg-blue-600 px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition">
          Explore Properties
        </button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-10 bg-gray-950">
        <h2 className="text-3xl font-bold text-center mb-12">Why BrickVest?</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Low Investment</h3>
            <p className="text-gray-400">
              Start investing in premium properties with as low as ₹5,000.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Monthly Rental Income</h3>
            <p className="text-gray-400">
              Earn consistent passive income directly to your bank account.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Safe & Verified</h3>
            <p className="text-gray-400">
              All properties are legally verified and insured.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;