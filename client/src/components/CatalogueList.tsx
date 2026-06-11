import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CatalogueList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const { results, loading, hasMore, performSearch } = useCatalogue()

  // Filters & State
  const [distFilter, setDistFilter] = useState('All')
  const [formatFilter, setFormatFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('artist')
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef(null)

  // Manifest & HUD Data
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
      const orderRes = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setBudgetLimit(orderRes.body.budget_limit)
      setSessionName(orderRes.body.name)

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

  // Finalize Mission
  const handleFinalize = async () => {
    if (
      !window.confirm(
        'Finalize this mission? This will lock the order for distribution.',
      )
    )
      return
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}/finalize`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/')
    } catch (err) {
      console.error('Finalize failed')
    }
  }

  // 🎯 NEW: Abort / Delete Mission
  const handleDeleteOrder = async () => {
    if (
      !window.confirm(
        'ABORT MISSION: Are you sure you want to permanently delete this entire order? This cannot be undone.',
      )
    )
      return
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/') // Kick back to Hub
    } catch (err) {
      console.error('Delete order failed')
    }
  }

  const handleReset = () => {
    setSearchTerm('')
    setDistFilter('All')
    setSortOrder('artist')
    setFormatFilter('All')
  }

  // Logic for the "Already Added" tick
  const getItemQuantityInOrder = (masterId: number) => {
    const match = orderItems.find((oi) => oi.master_catalogue_id === masterId)
    return match ? match.quantity : 0
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

      {/* HUD SIDEBAR */}
      <div className="fixed top-24 right-6 w-72 z-50 h-[calc(100vh-120px)] flex flex-col gap-4">
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleFinalize}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase py-3 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Finalize
              </button>
              {/* 🎯 NEW: Abort Button */}
              <button
                onClick={handleDeleteOrder}
                className="flex-none bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black text-[10px] uppercase px-4 py-3 rounded-2xl transition-all active:scale-95"
                title="Abort Mission"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Current Manifest Panel */}
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
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
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
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((item) => {
              const qtyInOrder = getItemQuantityInOrder(item.id)
              return (
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
                      {/* 🎯 The Green Tick (Appears if already added) */}
                      {qtyInOrder > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg animate-in fade-in zoom-in duration-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-[9px] font-black">
                            ({qtyInOrder})
                          </span>
                        </div>
                      )}

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
              )
            })}
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
