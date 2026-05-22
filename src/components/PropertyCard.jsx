import React from "react";
import { Link } from "react-router-dom";

function PropertyCard({ property }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition duration-300">

      <img
        src={property?.image}
        alt={property?.title}
        className="h-56 w-full object-cover"
      />

      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">
          {property?.title}
        </h2>

        <p className="text-gray-400 mb-4">
          📍 {property?.location}
        </p>

        <p className="text-blue-400 font-bold mb-2">
          Total Value: ₹{property?.price?.toLocaleString() ?? "N/A"}
        </p>

        <p className="text-green-400 mb-4">
          Fractional Share: ₹{property?.sharePrice ?? "N/A"}
        </p>

        <Link
          to={`/property/${property?.id}`}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;