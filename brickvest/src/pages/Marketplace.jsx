import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import PropertyCard from "../components/PropertyCard";
import { db } from "../firebase/config";

function Marketplace() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const querySnapshot = await getDocs(collection(db, "properties"));

      const propertyList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProperties(propertyList);
    };

    fetchProperties();
  }, []);

  return (
    <div className="p-10 bg-gray-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Explore Investment Properties
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}

export default Marketplace;
