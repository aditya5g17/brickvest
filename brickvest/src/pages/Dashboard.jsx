import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

function Dashboard() {
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProperties, setTotalProperties] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "investments"));
      const data = snapshot.docs.map(doc => doc.data());

      const total = data.reduce(
        (sum, inv) => sum + (inv.totalInvestment || 0),
        0
      );

      setTotalInvested(total);
      setTotalProperties(data.length);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-950 text-white min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl">Total Invested</h2>
          <p className="text-2xl text-blue-400">
            ₹{totalInvested.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl">Properties Invested</h2>
          <p className="text-2xl text-green-400">
            {totalProperties}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;