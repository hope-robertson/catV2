import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import ImportData from './components/ImportData.js'
import CatalogueList from './components/CatalogueList.js'
import CatalogueSearch from './components/CatalogueSearch.js'
import './App.css'

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } =
    useAuth0()

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
              to="/search"
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
            >
              Search
            </Link>
            <Link
              to="/catalogue"
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
            >
              Full List
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Hi, {user?.nickname || user?.name}
                </span>
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
            <Route path="/search" element={<CatalogueSearch />} />
            <Route path="/catalogue" element={<CatalogueList />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
