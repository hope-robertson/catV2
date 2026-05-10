import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CatalogueList() {
  const { id } = useParams()
  const { getAccessTokenSilently } = useAuth0()
  const { results, loading, hasMore, performSearch } = useCatalogue()

  const [distFilter, setDistFilter] = useState('All')
  const [formatFilter, setFormatFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('artist')
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef(null)

  const [orderItems, setOrderItems] = useState<any[]>([])
  const [dbTotal, setDbTotal] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [sessionName, setSessionName] = useState('')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})

  const distributors = [
    'All',
    'Southbound',
    'Universal Music',
    'Border Music',
    'Collective (LP)',
    'Collective (CD)',
    'Rhythmethod',
    'Sony Music',
    'Warner Music',
  ]
  const formats = ['All', 'LP', 'CD', '7"', '12"', 'Cassette']

  const syncOrderContext = async () => {
    if (!id) return
    try {
      const token = await getAccessTokenSilently()

      // Fetch Header
      const orderRes = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setBudgetLimit(orderRes.body.budget_limit)
      setSessionName(orderRes.body.name)

      // 🎯 Fetch full summary for the sidebar list
      const summaryRes = await request
        .get(`/api/v1/orders/${id}/summary`)
        .set('Authorization', `Bearer ${token}`)
      setOrderItems(summaryRes.body.items)
      setDbTotal(summaryRes.body.stats.totalCost)
      setDbCount(
        summaryRes.body.items.reduce(
          (acc: number, item: any) => acc + item.quantity,
          0,
        ),
      )
    } catch (err) {
      console.error('Sync failed')
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getAccessTokenSilently()
        const orderRes = await request
          .get(`/api/v1/orders/${id}`)
          .set('Authorization', `Bearer ${token}`)
        setDistFilter(orderRes.body.distributor)
        await syncOrderContext()
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [id])

  useEffect(() => {
    setOffset(0)
    performSearch(searchTerm, distFilter, sortOrder, formatFilter, 0)
  }, [searchTerm, distFilter, sortOrder, formatFilter])

  useEffect(() => {
    if (offset > 0)
      performSearch(searchTerm, distFilter, sortOrder, formatFilter, offset)
  }, [offset])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading)
          setOffset((prev) => prev + 50)
      },
      { threshold: 1.0 },
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading])

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
      console.error('Add failed')
    }
  }

  // 🎯 New: Handle Item Removal
  const handleRemoveItem = async (itemId: number) => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
      await syncOrderContext()
    } catch (err) {
      console.error('Remove failed')
    }
  }

  const handleReset = () => {
    setSearchTerm('')
    setDistFilter('All')
    setSortOrder('artist')
    setFormatFilter('All')
  }

  const remaining = budgetLimit - dbTotal
  const percentUsed = Math.min((dbTotal / budgetLimit) * 100, 100)

  return (
    <div className="relative space-y-6 pb-20 pr-80">
      <header>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
          {sessionName}
        </h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          {distFilter} Records
        </p>
      </header>

      {/* 🚀 EXPANDED HUD SIDEBAR */}
      <div className="fixed top-24 right-6 w-72 z-50 h-[calc(100vh-120px)] flex flex-col gap-4">
        {/* Stats HUD */}
        <div className="bg-gray-900 shadow-2xl rounded-[32px] p-6 text-white border-2 border-white/10 shrink-0">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Live Spend
              </p>
              <p className="text-2xl font-black">{formatCurrency(dbTotal)}</p>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-700"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                  Limit: ${budgetLimit}
                </p>
                <p
                  className={`text-sm font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                  Total Qty
                </p>
                <p className="text-sm font-bold">{dbCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 Current Manifest List */}
        <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Current Manifest
            </h3>
            <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full">
              {orderItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {orderItems.length === 0 ? (
              <p className="text-center text-[10px] text-gray-300 font-bold mt-10 px-4">
                No items added to this mission yet.
              </p>
            ) : (
              orderItems.map((item) => (
                <div
                  key={item.item_id}
                  className="p-3 bg-gray-50 rounded-2xl flex justify-between items-start group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[10px] font-black text-gray-900 truncate">
                      {item.artist}
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold truncate leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[9px] text-blue-500 font-black mt-1">
                      x{item.quantity} • ${item.ams_price}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.item_id)}
                    className="text-gray-300 hover:text-red-500 transition-colors pt-0.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* COMMAND BAR */}
      <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex gap-4 items-center">
        <div className="flex-1">
          <SearchBar onSearch={(q) => setSearchTerm(q)} />
        </div>
        <button
          onClick={handleReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          Reset
        </button>
        <select
          value={distFilter}
          onChange={(e) => setDistFilter(e.target.value)}
          className="bg-gray-50 border-none text-gray-700 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
        >
          {distributors.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Distributors' : d}
            </option>
          ))}
        </select>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-gray-50 border-none text-gray-700 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
        >
          {formats.map((f) => (
            <option key={f} value={f}>
              {f === 'All' ? 'All Formats' : f}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="bg-gray-50 border-none text-blue-600 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
        >
          <option value="artist">A-Z</option>
          <option value="format">Format</option>
          <option value="low">Price ↑</option>
          <option value="high">Price ↓</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-xl rounded-[40px] overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Artist
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Title
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Format
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-right tracking-widest">
                Wholesale
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/20 transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">
                    {item.artist || 'Various'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-500 font-medium">
                    {item.title}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${item.format?.includes('LP') ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}
                  >
                    {item.format || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-400">
                  ${(item.price ?? 0).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={quantities[item.id] || 1}
                      onChange={(e) =>
                        setQuantities({
                          ...quantities,
                          [item.id]: parseInt(e.target.value),
                        })
                      }
                      className="w-10 p-2 bg-gray-50 border-none rounded-xl text-xs font-black text-center outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleAddToOrder(item)}
                      className="bg-gray-900 group-hover:bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase shadow-lg active:scale-95 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          ref={observerTarget}
          className="h-24 flex items-center justify-center"
        >
          {loading && (
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-blue-500">
              Scanning more inventory...
            </p>
          )}
          {!hasMore && results.length > 0 && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              Catalogue End reached
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
