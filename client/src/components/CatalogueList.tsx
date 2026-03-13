import React from 'react'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'

export default function CatalogueList() {
  const { results, loading, performSearch } = useCatalogue()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Catalogue Audit
        </h2>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          {results.length} Records Shown
        </span>
      </div>

      <SearchBar onSearch={performSearch} />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500 font-medium">
            Querying Master Database...
          </p>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Artist
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Title
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Distributor
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Format
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Cat No
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((item, i) => (
              <tr
                key={`${item.source_distributor}-${item.catalogue_number}-${i}`}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  {item.artist || 'VARIOUS'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {item.title}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                    {item.source_distributor}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">
                    {item.format}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-[11px] font-mono text-gray-500">
                  {item.catalogue_number || '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-green-700">
                    ${item.price?.toFixed(2) || '0.00'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && results.length === 0 && (
          <div className="text-center py-20 bg-gray-50 border-t border-gray-100">
            <p className="text-gray-500 font-medium">
              No records found matching that search.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Try a different keyword or check your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
