import React, { useState, useEffect } from 'react'

interface CatalogueItem {
  artist: string
  title: string
  format: string
  price: number
  source_distributor: string
  catalogue_number: string
}

const CatalogueSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/v1/catalogue/search?q=${encodeURIComponent(query)}`,
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchResults, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Catalogue Search
      </h2>
      <input
        type="text"
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
        placeholder="Search Artist, Title, or Catalogue Number..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <p className="mt-4 text-blue-600 font-medium animate-pulse">
          Searching 21,865 records...
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                Artist
              </th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                Format
              </th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                Distributor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {item.artist}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.title}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {item.format}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-green-700">
                  ${item.price?.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 uppercase tracking-tighter">
                  {item.source_distributor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="p-4 text-center text-gray-500 italic">
            No matching records found.
          </p>
        )}
      </div>
    </div>
  )
}

export default CatalogueSearch
