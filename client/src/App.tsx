import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from './hooks/useStaff.js'

// Components
import ImportData from './components/ImportData.js'
import CatalogueList from './components/CatalogueList.js'
import CreateOrder from './components/CreateOrder.js'
import ActiveOrders from './components/ActiveOrders.js'
import OrderReview from './components/OrderReview.js'
import AdminPanel from './components/AdminPanel.js'

function App() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    user,
    isLoading: authLoading,
  } = useAuth0()

  const { isAdmin, isTrusted, isLoading: staffLoading } = useStaff()

  const isLoading = authLoading || (isAuthenticated && staffLoading)

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
        <nav className="bg-white shadow-md rounded-lg p-4 mb-6 flex justify-between items-center max-w-5xl mx-auto border-b-4 border-blue-600">
          <div className="flex space-x-6 items-center">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 font-black text-xs uppercase tracking-widest"
            >
              Import
            </Link>
            <Link
              to="/orders"
              className="text-blue-600 hover:text-blue-800 font-black text-xs uppercase tracking-widest"
            >
              Orders
            </Link>
            {isTrusted && (
              <Link
                to="/orders/new"
                className="text-green-600 hover:text-green-800 font-black text-xs uppercase tracking-widest"
              >
                New Order
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-purple-600 hover:text-purple-800 font-black text-xs uppercase tracking-widest"
              >
                ⚙️ Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest animate-pulse">
                Scanning Bio-Signs...
              </span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4 border-l pl-4 border-gray-100">
                <div className="text-right">
                  <p className="text-xs font-black text-gray-900 leading-none">
                    {user?.nickname || user?.name}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-1">
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
                  className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 p-2 rounded-lg transition-all shadow-sm"
                >
                  <span className="text-xs font-black uppercase tracking-tighter px-1">
                    Exit
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                Log In
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<ImportData />} />
            <Route path="/orders" element={<ActiveOrders />} />
            <Route path="/orders/:id/catalogue" element={<CatalogueList />} />

            {/* 🎯 Updated Guarded Route */}
            <Route
              path="/orders/:id/review"
              element={isTrusted ? <OrderReview /> : <Navigate to="/orders" />}
            />

            <Route
              path="/orders/new"
              element={isTrusted ? <CreateOrder /> : <Navigate to="/orders" />}
            />

            <Route
              path="/admin"
              element={isAdmin ? <AdminPanel /> : <Navigate to="/orders" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
