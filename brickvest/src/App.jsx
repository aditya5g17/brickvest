import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import MarketFeed from './pages/MarketFeed'
import PropertyDetail from './pages/PropertyDetail'
import Portfolio from './pages/Portfolio'
import Calculator from './pages/Calculator'
import Profile from './pages/Profile'
import AddProperty from './pages/AddProperty'
import EditProperty from './pages/EditProperty'
import ReviewQueue from './pages/ReviewQueue'
import KycQueue from './pages/KycQueue'
import AdminDashboard from './pages/AdminDashboard'
import AdminTransactions from './pages/AdminTransactions'
import PaymentHistory from './pages/PaymentHistory'
import OwnershipCertificate from './pages/OwnershipCertificate'
import Onboarding from './pages/Onboarding'
import Recommendations from './pages/Recommendations'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingRoute from './components/OnboardingRoute'

function App() {
  return (
    <Router>
      <div className="page-shell flex min-h-screen flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/market-feed" element={<MarketFeed />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/property/:id/edit" element={<ProtectedRoute requireAdmin><EditProperty /></ProtectedRoute>} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="/certificate/:investmentId" element={<ProtectedRoute><OwnershipCertificate /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requireOnboarding={false}><Profile /></ProtectedRoute>} />
          <Route path="/add-property" element={<ProtectedRoute requireAdmin><AddProperty /></ProtectedRoute>} />
          <Route path="/review-queue" element={<ProtectedRoute requireAdmin><ReviewQueue /></ProtectedRoute>} />
          <Route path="/admin/kyc-queue" element={<ProtectedRoute requireAdmin><KycQueue /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute requireAdmin><AdminTransactions /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <ChatBot />
      </div>
    </Router>
  )
}

export default App
