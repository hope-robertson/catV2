import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from '../hooks/useStaff.js'

export default function NavBar() {
  const { logout, isAuthenticated, user, loginWithRedirect } = useAuth0()
  const { isAdmin, isTrusted } = useStaff()

  return (
    <nav className="bg-white shadow-md rounded-lg p-4 mb-6 border-b-4 border-blue-600 max-w-5xl mx-auto flex justify-between items-center">
      <div className="flex gap-6 items-center">
        {/* PROCUREMENT SECTION */}
        <div className="flex gap-4 border-r pr-6">
          <Link
            to="/"
            className="text-gray-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest"
          >
            Import
          </Link>
          <Link
            to="/orders"
            className="text-gray-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest"
          >
            Supply Missions
          </Link>
          {isTrusted && (
            <Link
              to="/orders/new"
              className="text-green-600 font-black text-[9px] uppercase tracking-widest"
            >
              + New Mission
            </Link>
          )}
        </div>

        {/* CUSTOMER SECTION */}
        <div className="flex gap-4">
          <Link
            to="/customer-orders"
            className="text-blue-600 hover:text-blue-800 font-black text-[9px] uppercase tracking-widest"
          >
            Customer Orders
          </Link>
          <Link
            to="/customer-orders/new"
            className="text-blue-600 hover:text-blue-800 font-black text-[9px] uppercase tracking-widest"
          >
            + New
          </Link>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="text-purple-600 font-black text-[9px] uppercase tracking-widest"
          >
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* User Login/Logout logic */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="text-[9px] font-black uppercase text-gray-400"
          >
            Exit
          </button>
        ) : (
          <button
            onClick={() => loginWithRedirect()}
            className="text-[9px] font-black uppercase text-blue-600"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  )
}
