import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { calculateRetail, formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CatalogueList() {
  const { id } = useParams() // 🎯 Grabs ID from URL: /orders/5/catalogue
  const { getAccessTokenSilently } = useAuth0()
  const { results, loading, performSearch } = useCatalogue()

  const [distFilter, setDistFilter] = useState('All')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [dbTotal, setDbTotal] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [searchKey, setSearchKey] = useState(0)

  // 📡 Sync the whole page with the Database Truth
  const syncOrderContext = async () => {
    if (!id) return
    try {
      const token = await getAccessTokenSilently()

      // 1. Fetch Order Header (Distributor & Budget)
      const orderRes = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)

      const order = orderRes.body
      setBudgetLimit(order.budget_limit)
      setDistFilter(order.distributor)

      // Auto-perform search for that distributor
      performSearch('', order.distributor)

      // 2. Fetch Live Stats
      const statsRes = await request
        .get(`/api/v1/orders/${id}/stats`)
        .set('Authorization', `Bearer ${token}`)

      setDbTotal(statsRes.body.total || 0)
      setDbCount(statsRes.body.count || 0)
    } catch (err) {
      console.error('❌ Failed to sync order context:', err)
    }
  }

  useEffect(() => {
    syncOrderContext()
  }, [id])

  const handleClear = () => {
    setDistFilter('All')
    setSearchKey((prev) => prev + 1)
    performSearch('', 'All')
  }

  const handleQuantityChange = (id: number, val: string) => {
    const num = parseInt(val) || 1
    setQuantities((prev) => ({ ...prev, [id]: num }))
  }

  const handleAddToOrder = async (item: any) => {
    const qty = quantities[item.id] || 1
    try {
      const token = await getAccessTokenSilently()
      await request
        .post(`/api/v1/orders/${id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          master_catalogue_id: item.id,
          quantity: qty,
          ams_price: item.price,
        })

      await syncOrderContext()
      setQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    } catch (err) {
      console.error('❌ Add failed:', err)
    }
  }

  const filteredResults = results.filter(
    (item) => distFilter === 'All' || item.source_distributor === distFilter,
  )

  const remaining = budgetLimit - dbTotal
  const percentUsed = Math.min((dbTotal / budgetLimit) * 100, 100)

  const hudStatus =
    remaining < -100
      ? 'bg-red-600'
      : remaining < 0
        ? 'bg-amber-500'
        : 'bg-gray-900'
  const barColor =
    remaining < 0
      ? 'bg-red-400'
      : percentUsed > 85
        ? 'bg-amber-400'
        : 'bg-green-400'

  return (
    <div className="space-y-6 pb-44">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
          Procurement Session #{id}
        </h2>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
          {filteredResults.length} Matches in {distFilter}
        </span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchBar
            key={searchKey}
            onSearch={(query) => performSearch(query, distFilter)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={distFilter}
            onChange={(e) => setDistFilter(e.target.value)}
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
            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-black uppercase"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Artist / Title
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Wholesale
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">
                Retail
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center italic">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredResults.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900 uppercase leading-none">
                    {item.artist || 'VARIOUS'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">
                    {item.title}
                  </p>
                </td>
                <td className="px-6 py-4 text-right text-xs text-gray-400 italic font-mono">
                  ${(item.price || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-green-700 bg-green-50 px-2 py-1 rounded">
                    {formatCurrency(calculateRetail(item.price || 0))}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={quantities[item.id] || 1}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      className="w-12 p-2 border-2 border-blue-100 rounded-lg text-xs font-black text-center"
                    />
                    <button
                      onClick={() => handleAddToOrder(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase shadow-md transition-all active:scale-95"
                    >
                      + Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50">
        <div
          className={`${hudStatus} shadow-2xl rounded-3xl p-6 text-white border-2 border-white/20 transition-all backdrop-blur-md`}
        >
          <div className="w-full bg-white/10 h-2 rounded-full mb-4 overflow-hidden">
            <div
              className={`${barColor} h-full transition-all duration-700 ease-out`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                Spent
              </div>
              <div className="text-2xl font-black">
                {formatCurrency(dbTotal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                Items
              </div>
              <div className="text-2xl font-black">{dbCount}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                Remaining
              </div>
              <div
                className={`text-2xl font-black ${remaining < 0 ? 'text-red-300' : 'text-green-300'}`}
              >
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
