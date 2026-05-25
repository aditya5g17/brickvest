import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";

function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      const docRef = doc(db, "properties", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProperty({ id: docSnap.id, ...docSnap.data() });
      }
    };

    fetchProperty();
  }, [id]);

  const handleInvest = async () => {
    if (!property) return;

    try {
      await addDoc(collection(db, "investments"), {
        propertyId: property.id,
        propertyTitle: property.title,
        sharePrice: property.sharePrice,
        shares: 1,
        totalInvestment: property.sharePrice
      });

      alert("Investment Successful ✅");
    } catch (error) {
      console.error(error);
      alert("Investment Failed ❌");
    }
  };

  if (!property) {
    return (
      <div className="text-white p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen p-10">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-96 object-cover"
        />

        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">
            {property.title}
          </h1>

          <p className="text-gray-400 mb-4">
            Location: {property.location}
          </p>

          <p className="text-blue-400 font-bold text-xl mb-2">
            Total Value: Rs.{property?.price?.toLocaleString() || 0}
          </p>

          <p className="text-green-400 text-lg mb-6">
            Fractional Share: Rs.{property?.sharePrice ?? "N/A"}
          </p>

          <button
            onClick={handleInvest}
            className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Invest Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetail;