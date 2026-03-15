import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from './hooks/useStaff.js' // Import our new badge check
import ImportData from './components/ImportData.js'
import CatalogueList from './components/CatalogueList.js'
// These components will be created next
// import CreateOrder from './components/CreateOrder'
// import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    user,
    isLoading: authLoading,
  } = useAuth0()
  const { isAdmin, isTrusted, isLoading: staffLoading } = useStaff()

  const isLoading = authLoading || staffLoading

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
        <nav className="bg-white shadow-md rounded-lg p-4 mb-6 flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex space-x-6 items-center">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
            >
              Import
            </Link>
            <Link
              to="/catalogue"
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
            >
              Catalogue
            </Link>

            {/* 🛡️ SECURITY CHECK: Only Trusted Orderers see this */}
            {isTrusted && (
              <Link
                to="/orders/new"
                className="text-green-600 hover:text-green-800 font-semibold text-lg"
              >
                Create Order
              </Link>
            )}

            {/* 👑 SECURITY CHECK: Only Admins see the Gear Icon/Admin Panel */}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-purple-600 hover:text-purple-800 font-semibold text-lg"
              >
                ⚙️ Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-gray-400 italic animate-pulse">
                Scanning Bio-Signs...
              </span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">
                    {user?.nickname || user?.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                    {isAdmin
                      ? 'Ship Captain'
                      : isTrusted
                        ? 'Senior Officer'
                        : 'Crew Member'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    logout({
                      logoutParams: { returnTo: window.location.origin },
                    })
                  }
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-all shadow-md"
              >
                Log In
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<ImportData />} />
            <Route path="/catalogue" element={<CatalogueList />} />

            {/* Protected Routes: We'll build these elements next! */}
            <Route
              path="/orders/new"
              element={
                isTrusted ? (
                  <div className="p-8 bg-white rounded-xl shadow-inner">
                    Order Interface coming soon...
                  </div>
                ) : (
                  <Navigate to="/catalogue" />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAdmin ? (
                  <div className="p-8 bg-white rounded-xl shadow-inner border-2 border-purple-200">
                    Admin Controls coming soon...
                  </div>
                ) : (
                  <Navigate to="/catalogue" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
