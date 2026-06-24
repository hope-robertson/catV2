import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from './hooks/useStaff.js'

// Components
import NavBar from './components/NavBar.js'
import ImportData from './components/ImportData.js'
import CatalogueList from './components/CatalogueList.js'
import CreateOrder from './components/CreateOrder.js'
import ActiveOrders from './components/ActiveOrders.js'
import OrderReview from './components/OrderReview.js'
import AdminPanel from './components/AdminPanel.js'
import NewCustomerOrder from './components/NewCustomerOrder.js'
import ActiveCustomerOrders from './components/ActiveCustomerOrders.js'
import Wishlist from './components/Wishlist.js'
function App() {
  const { isAdmin, isTrusted } = useStaff()

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
        <NavBar />
        <main className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<ImportData />} />
            <Route path="/catalogue" element={<CatalogueList />} />
            <Route path="/wishlist" element={<Wishlist />} />{' '}
            {/* 🎯 NEW: Wishlist Route */}
            <Route path="/orders" element={<ActiveOrders />} />
            <Route path="/orders/:id/catalogue" element={<CatalogueList />} />
            <Route
              path="/orders/:id/review"
              element={isTrusted ? <OrderReview /> : <Navigate to="/orders" />}
            />
            <Route
              path="/orders/new"
              element={isTrusted ? <CreateOrder /> : <Navigate to="/orders" />}
            />
            <Route path="/customer-orders" element={<ActiveCustomerOrders />} />
            <Route path="/customer-orders/new" element={<NewCustomerOrder />} />
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
