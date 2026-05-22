import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import PropertyDetail from './pages/PropertyDetail'
import Portfolio from './pages/Portfolio'
import Calculator from './pages/Calculator'
import Profile from './pages/Profile'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      <div className="bg-gray-950 min-h-screen text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App