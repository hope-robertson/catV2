import React, { useState } from 'react'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { calculateRetail, formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CatalogueList() {
  const { getAccessTokenSilently } = useAuth0()
  const { results, loading, performSearch } = useCatalogue()

  const [distFilter, setDistFilter] = useState('All')
  const [addedItems, setAddedItems] = useState<any[]>([])

  // 🔑 This key forces the SearchBar to reset when it changes
  const [searchKey, setSearchKey] = useState(0)

  const activeOrderId = localStorage.getItem('activeOrderId')
  const budgetLimit = Number(localStorage.getItem('activeOrderBudget') || 0)

  const handleClear = () => {
    console.log('🧹 handleClear: Resetting filter and incrementing searchKey')
    setDistFilter('All')
    setSearchKey((prev) => prev + 1)

    console.log('📡 handleClear: Triggering performSearch with empty query')
    performSearch('', 'All')
  }

  const handleAddToOrder = async (item: any) => {
    if (!activeOrderId) return
    console.log(`➕ Adding item ${item.id} to order ${activeOrderId}`)

    try {
      const token = await getAccessTokenSilently()
      await request
        .post(`/api/v1/orders/${activeOrderId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          master_catalogue_id: item.id,
          quantity: 1,
          ams_price: item.price,
        })

      setAddedItems([...addedItems, item])
      console.log('✅ Item successfully added to database')
    } catch (err) {
      console.error('❌ Failed to add item:', err)
    }
  }

  const filteredResults = results.filter(
    (item) => distFilter === 'All' || item.source_distributor === distFilter,
  )

  const totalSpent = addedItems.reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  )
  const remaining = budgetLimit - totalSpent
  const status =
    remaining < -100
      ? 'bg-red-600'
      : remaining < 0
        ? 'bg-amber-500'
        : 'bg-gray-900'

  return (
    <div className="space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
          Catalogue Audit
        </h2>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
          {filteredResults.length} Records Shown
        </span>
      </div>

      {/* 🛠️ CONTROL BAR */}
      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchBar
            key={searchKey}
            onSearch={(query) => {
              console.log(
                `🔍 performSearch called with query: "${query}", filter: "${distFilter}"`,
              )
              performSearch(query, distFilter)
            }}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={distFilter}
            onChange={(e) => {
              console.log(`🎯 Filter changed to: ${e.target.value}`)
              setDistFilter(e.target.value)
            }}
            className="flex-1 md:flex-none p-2.5 border rounded-lg bg-gray-50 text-xs font-bold outline-none"
          >
            <option value="All">All Distributors</option>
            {Array.from(new Set(results.map((r) => r.source_distributor)))
              .filter(Boolean)
              .map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>

          <button
            onClick={handleClear}
            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition-colors shadow-sm"
          >
            Clear Search
          </button>
        </div>
      </div>

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
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Wholesale
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">
                Retail
              </th>
              {activeOrderId && (
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center italic">
                  Session
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredResults.map((item, i) => (
              <tr
                key={i}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">
                  {item.artist || 'VARIOUS'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {item.title}
                </td>
                <td className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase">
                  {item.source_distributor}
                </td>
                <td className="px-6 py-4 text-right text-xs text-gray-400 italic font-mono">
                  ${(item.price || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-green-700 bg-green-50 px-2 py-1 rounded">
                    {formatCurrency(calculateRetail(item.price || 0))}
                  </span>
                </td>
                {activeOrderId && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleAddToOrder(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black px-3 py-2 rounded uppercase active:scale-95 shadow-md"
                    >
                      + Add to Current Order
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeOrderId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div
            className={`${status} shadow-2xl rounded-2xl p-4 flex items-center justify-between text-white border-2 border-white/20 transition-all`}
          >
            <div>
              <div className="text-[10px] font-black uppercase opacity-60">
                Session Total
              </div>
              <div className="text-xl font-black">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase opacity-60">
                Qty
              </div>
              <div className="text-xl font-black">{addedItems.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase opacity-60">
                Remaining
              </div>
              <div className="text-xl font-black">${remaining.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
