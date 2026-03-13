import React, { useState, useEffect } from 'react'

const CatalogueList = () => {
  const [items, setItems] = useState([])
  const [sort, setSort] = useState({ col: 'artist', dir: 'asc' })

  useEffect(() => {
    fetch(`/api/v1/catalogue/master?sortCol=${sort.col}&sortDir=${sort.dir}`)
      .then((res) => res.json())
      .then(setItems)
  }, [sort])

  const toggleSort = (col) => {
    setSort({
      col,
      dir: sort.col === col && sort.dir === 'asc' ? 'desc' : 'asc',
    })
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Master Catalogue ({items.length})
        </h2>
        <div className="space-x-2">
          <button
            onClick={() => toggleSort('artist')}
            className="bg-gray-200 px-3 py-1 rounded text-sm"
          >
            Sort Artist
          </button>
          <button
            onClick={() => toggleSort('price')}
            className="bg-gray-200 px-3 py-1 rounded text-sm"
          >
            Sort Price
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-500">
                Artist
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-500">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-500">
                Format
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-500">
                Price
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-500">
                Distributor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">{item.artist}</td>
                <td className="px-4 py-2 text-sm">{item.title}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {item.format}
                </td>
                <td className="px-4 py-2 text-sm font-bold text-green-600">
                  ${item.price?.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">
                  {item.source_distributor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CatalogueList
