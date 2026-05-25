import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

function Portfolio() {
  const [investments, setInvestments] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchInvestments = async () => {
      const snapshot = await getDocs(collection(db, "investments"));

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInvestments(data);

      const totalAmount = data.reduce(
        (sum, inv) => sum + (inv.totalInvestment || 0),
        0
      );

      setTotal(totalAmount);
    };

    fetchInvestments();
  }, []);

  return (
    <div className="bg-gray-950 text-white min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>

      <h2 className="text-xl mb-6 text-blue-400">
        Total Invested: ₹{total.toLocaleString()}
      </h2>

      {investments.length === 0 ? (
        <p>No investments yet.</p>
      ) : (
        <div className="space-y-4">
          {investments.map(inv => (
            <div key={inv.id} className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold">
                {inv.propertyTitle}
              </h2>
              <p>Shares: {inv.shares}</p>
              <p>Total Invested: ₹{inv.totalInvestment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Portfolio;