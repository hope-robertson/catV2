// client/src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ImportData from './components/ImportData.js'
import CatalogueList from './components/CatalogueList.js'
import './App.css' // Or your main CSS file

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4">
        <nav className="bg-white shadow-md rounded-lg p-4 mb-6 flex justify-center space-x-4">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
          >
            Import Data
          </Link>
          <Link
            to="/catalogue"
            className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
          >
            View Catalogue
          </Link>
        </nav>

        <main className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <Routes>
            <Route path="/" element={<ImportData />} />
            <Route path="/catalogue" element={<CatalogueList />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
