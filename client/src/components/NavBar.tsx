import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from '../hooks/useStaff.js'
import {
  LogOut,
  LogIn,
  Settings,
  PlusCircle,
  Package,
  ClipboardList,
  Database,
  Star,
  Users,
} from 'lucide-react'

// Classic 90s OS button style
const WinButton = ({ children, className = '', ...props }: any) => (
  <button
    {...props}
    className={`px-3 py-1 text-black border-[2px] border-white border-r-[#404040] border-b-[#404040] bg-[#C0C0C0] active:border-[#404040] active:border-r-white active:border-b-white active:bg-[#A0A0A0] flex items-center gap-1 ${className}`}
  >
    {children}
  </button>
)

export default function NavBar() {
  const { logout, isAuthenticated, loginWithRedirect } = useAuth0()
  const { isAdmin, isTrusted } = useStaff()

  return (
    <nav className="bg-[#C0C0C0] border-[2px] border-white border-r-[#404040] border-b-[#404040] p-1 shadow-lg max-w-5xl mx-auto mb-6 mt-4">
      {/* OS Window Header */}
      <div className="bg-[#000080] text-white px-2 py-0.5 flex justify-between items-center mb-1">
        <span className="font-bold text-[10px] tracking-widest">
          R.O.S.S. SYSTEM NAVIGATOR
        </span>
      </div>

      <div className="flex gap-1 p-1 flex-wrap items-center">
        {/* DATA & INVENTORY */}
        <Link to="/" className="nav-link">
          <WinButton>
            <Database size={12} /> Import
          </WinButton>
        </Link>
        <Link to="/catalogue" className="nav-link">
          <WinButton>
            <Package size={12} /> Catalogue
          </WinButton>
        </Link>
        <Link to="/wishlist" className="nav-link">
          <WinButton>
            <Star size={12} /> My Wishlist
          </WinButton>
        </Link>

        {/* OS Toolbar Separator */}
        <div className="w-[2px] h-6 bg-gray-400 border-r border-white mx-1"></div>

        {/* PROCUREMENT / SHOP ORDERS */}
        <Link to="/orders" className="nav-link">
          <WinButton>
            <ClipboardList size={12} /> Active Orders
          </WinButton>
        </Link>
        {isTrusted && (
          <Link to="/orders/new" className="nav-link">
            <WinButton>
              <PlusCircle size={12} />
              New Mission
            </WinButton>
          </Link>
        )}

        {/* OS Toolbar Separator */}
        <div className="w-[2px] h-6 bg-gray-400 border-r border-white mx-1"></div>

        {/* CUSTOMER PIPELINE */}
        <Link to="/customer-orders" className="nav-link">
          <WinButton>
            <Users size={12} /> Customer Orders
          </WinButton>
        </Link>
        <Link to="/customer-orders/new" className="nav-link">
          <WinButton>
            <PlusCircle size={12} /> New Customer Order
          </WinButton>
        </Link>

        <div className="flex gap-1 ml-auto">
          {/* Always show Admin panel during development */}
          <Link to="/admin">
            <WinButton>
              <Settings size={12} />
              Admin
            </WinButton>
          </Link>

          {isAuthenticated ? (
            <WinButton
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              <LogOut size={12} />
              Exit
            </WinButton>
          ) : (
            <WinButton onClick={() => loginWithRedirect()}>
              <LogIn size={12} />
              Login
            </WinButton>
          )}
        </div>
      </div>
    </nav>
  )
}
