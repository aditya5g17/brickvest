import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#0a2540",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(10, 37, 64, 0.1)",
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
)
