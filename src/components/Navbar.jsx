import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-500">
        BrickVest
      </h1>

      <div className="space-x-6 text-gray-300">
        <Link to="/" className="hover:text-blue-400">Home</Link>
        <Link to="/marketplace" className="hover:text-blue-400">Marketplace</Link>
        <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        <Link to="/portfolio" className="hover:text-blue-400">Portfolio</Link>
        <Link to="/login" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white">
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;