import React from 'react'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'

export default function CatalogueList() {
  const { results, loading, performSearch, handleRatingUpdate } = useCatalogue()

  // This object maps the rating number to a specific Tailwind CSS color scheme
  const ratingStyles: Record<number, string> = {
    0: 'bg-gray-100 text-gray-600 border-gray-200',
    1: 'bg-red-50 text-red-700 border-red-200', // Risky Pick
    2: 'bg-blue-50 text-blue-700 border-blue-200', // Under Review
    3: 'bg-yellow-50 text-yellow-800 border-yellow-400 font-bold', // Classic Banger
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Catalogue Search</h2>
        <span className="text-sm text-gray-500">
          {results.length} results found
        </span>
      </div>

      {/* Search Input and Filter */}
      <SearchBar onSearch={performSearch} />

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-blue-600 font-medium">
            Flipping through the bins...
          </p>
        </div>
      )}

      {/* Results Table/List */}
      <div className="grid gap-4">
        {results.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-gray-600">{item.artist}</p>

              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                  {item.barcode || 'NO BARCODE'}
                </span>
                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {item.format}
                </span>
                {item.is_nz_music && (
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                    🇳🇿 NZ Music
                  </span>
                )}
              </div>
            </div>

            {/* Rating Dropdown */}
            <div className="mt-4 md:mt-0 flex flex-col items-end gap-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Vibe Status
              </label>
              <select
                value={item.rating}
                onChange={(e) =>
                  handleRatingUpdate(item.id, Number(e.target.value))
                }
                className={`text-sm border rounded-md px-3 py-1.5 cursor-pointer outline-none transition-all ${ratingStyles[item.rating]}`}
              >
                <option value={0}>Unrated</option>
                <option value={1}> Risky Pick</option>
                <option value={2}> Under Review</option>
                <option value={3}> Classic Banger</option>
              </select>
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">
              No records found. Try searching for an artist or scanning a
              barcode.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
