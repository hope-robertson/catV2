import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { useStaff } from '../hooks/useStaff.js'
import { useAuth0 } from '@auth0/auth0-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import request from 'superagent'
import ActiveOrderSidebar from './ActiveOrderSidebar.js'

export default function CatalogueList() {
  const { id } = useParams() // If undefined, we are in Global Mode
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()

  const { results, loading, hasMore, performSearch } = useCatalogue()
  const { isTrusted } = useStaff()

  // -- MAIN CATALOGUE STATE --
  const [distFilter, setDistFilter] = useState('All')
  const [formatFilter, setFormatFilter] = useState('All Vinyl')
  const [sortOrder, setSortOrder] = useState('a-z')
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef<HTMLDivElement | null>(null)

  // 🎯 Dedicated error state to catch silent failures
  const [actionError, setActionError] = useState<string | null>(null)

  // -- SHOP ORDER STATE --
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [dbTotal, setDbTotal] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [sessionName, setSessionName] = useState('')
  const [quantities, setQuantities] = useState<{ [key: number]: string }>({})

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

  const addToWishlistMutation = useMutation({
    mutationFn: async (master_catalogue_id: number) => {
      const token = await getAccessTokenSilently()
      await request
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ master_catalogue_id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Sync Logic...
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
        if (id) {
          const orderRes = await request
            .get(`/api/v1/orders/${id}`)
            .set('Authorization', `Bearer ${token}`)
          setDistFilter(orderRes.body.distributor)
          await syncOrderContext()
        }
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [id])

  useEffect(() => {
    setOffset(0)
    performSearch(searchTerm, distFilter, 'artist', 'All', 0)
  }, [searchTerm, distFilter])

  useEffect(() => {
    if (offset > 0)
      performSearch(searchTerm, distFilter, 'artist', 'All', offset)
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

  // Frontend Filtering & Sorting Logic
  const processedResults = useMemo(() => {
    let filtered = [...results]

    if (formatFilter === 'All Vinyl') {
      filtered = filtered.filter((item) => {
        const fmt = (item.format || '').toLowerCase()
        return (
          fmt.includes('lp') ||
          fmt.includes('7"') ||
          fmt.includes('12"') ||
          fmt.includes('vinyl')
        )
      })
    } else if (formatFilter !== 'All') {
      filtered = filtered.filter((item) => item.format === formatFilter)
    }

    filtered.sort((a, b) => {
      if (sortOrder === 'price-low') return (a.price || 0) - (b.price || 0)
      if (sortOrder === 'price-high') return (b.price || 0) - (a.price || 0)
      return (a.artist || '').localeCompare(b.artist || '')
    })

    return filtered
  }, [results, formatFilter, sortOrder])

  // --- ACTIONS ---
  const handleAddToOrder = async (item: any) => {
    const qty = parseInt(quantities[item.id] || '1', 10)
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
      setQuantities((prev) => ({ ...prev, [item.id]: '1' }))
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

  const handleFinalize = async () => {
    setActionError(null)
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}/finalize`)
        .set('Authorization', `Bearer ${token}`)

      // 🎯 FIXED: Correctly route to review page!
      navigate(`/orders/${id}/review`)
    } catch (err: any) {
      console.error('Finalize failed:', err)
      setActionError(
        `Database error: ${err.response?.text || err.message}. Route fallback initiated.`,
      )
      setTimeout(() => navigate(`/orders/${id}/review`), 2000)
    }
  }

  const handleDeleteOrder = async () => {
    setActionError(null)
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/orders')
    } catch (err: any) {
      console.error('Delete failed:', err)
      setActionError(`Delete error: ${err.response?.text || err.message}`)
    }
  }

  const handleReset = () => {
    setSearchTerm('')
    setDistFilter('All')
    setSortOrder('a-z')
    setFormatFilter('All Vinyl')
  }

  const getItemQuantityInOrder = (masterId: number) => {
    const match = orderItems.find((oi) => oi.master_catalogue_id === masterId)
    return match ? match.quantity : 0
  }

  return (
    <div
      className={`relative space-y-6 pb-20 ${id ? 'lg:pr-[340px]' : 'max-w-6xl mx-auto'}`}
    >
      <header>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
          {sessionName || 'Master Catalogue'}
        </h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          {id ? `${distFilter} Records` : 'Global Inventory Search'}
        </p>
      </header>

      {/* 🎯 Visible Error Banner */}
      {actionError && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl shadow-sm">
          <p className="font-black uppercase text-[10px] tracking-widest mb-1">
            Action Failed
          </p>
          <p className="font-bold text-sm">{actionError}</p>
        </div>
      )}

      {/* RENDER THE EXTRACTED SIDEBAR */}
      {id && (
        <ActiveOrderSidebar
          dbTotal={dbTotal}
          dbCount={dbCount}
          budgetLimit={budgetLimit}
          orderItems={orderItems}
          isTrusted={isTrusted}
          onFinalize={handleFinalize}
          onAbort={handleDeleteOrder}
          onRemoveItem={handleRemoveItem}
        />
      )}

      {/* COMMAND BAR WITH FLEX WRAP */}
      <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-wrap lg:flex-nowrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchBar onSearch={(q) => setSearchTerm(q)} />
        </div>
        <button
          onClick={handleReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          Reset
        </button>

        {/* 🎯 CONDITIONAL DISTRIBUTOR DROPDOWN */}
        {id ? (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
            {distFilter === 'Rhythmethod'
              ? 'Rhythmethod / Sony / Warner'
              : distFilter}
          </div>
        ) : (
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
        )}

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-gray-50 border-none text-gray-700 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
        >
          <option value="All Vinyl">All Vinyl</option>
          <option value="LP">LP</option>
          <option value='7"'>7"</option>
          <option value='12"'>12"</option>
          <option value="CD">CD</option>
          <option value="Cassette">Cassette</option>
          <option value="All">Everything</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="bg-gray-50 border-none text-blue-600 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
        >
          <option value="a-z">A-Z</option>
          <option value="price-low">Price Low-High</option>
          <option value="price-high">Price High-Low</option>
        </select>
      </div>

      <div className="bg-white shadow-xl rounded-[40px] border border-gray-100 w-full overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest whitespace-nowrap">
                  Artist
                </th>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest whitespace-nowrap">
                  Title
                </th>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest whitespace-nowrap">
                  Format
                </th>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-right tracking-widest whitespace-nowrap">
                  Pricing
                </th>
                <th className="sticky right-0 bg-gray-50 px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedResults.map((item) => {
                const qtyInOrder = getItemQuantityInOrder(item.id)
                // Determine if the row should be highlighted
                const isSelected = qtyInOrder > 0

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/50 hover:bg-blue-100/50'
                        : 'hover:bg-gray-50/80'
                    }`}
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
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${item.format?.includes('LP') ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}
                      >
                        {item.format || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap pr-8">
                      <div className="flex flex-col items-end justify-center">
                        <span className="text-sm font-mono font-black text-gray-900">
                          ${(item.price ?? 0).toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-blue-500 mt-0.5">
                          RRP ${Math.ceil((item.price ?? 0) * 1.5).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`sticky right-0 px-6 py-4 text-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] transition-colors ${
                        isSelected
                          ? 'bg-blue-50/50 group-hover:bg-blue-100/50'
                          : 'bg-white group-hover:bg-gray-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {/* ACTION BUTTONS */}
                        {id ? (
                          isTrusted ? (
                            <button
                              onClick={() => handleAddToOrder(item)}
                              className="bg-gray-900 hover:bg-blue-600 text-white text-[9px] font-black px-5 py-2.5 rounded-xl uppercase shadow-lg active:scale-95 transition-all whitespace-nowrap"
                            >
                              Add {isSelected && `(${qtyInOrder})`}
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                              View Only
                            </span>
                          )
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 w-full max-w-[90px]">
                            <button
                              onClick={() =>
                                addToWishlistMutation.mutate(item.id)
                              }
                              className="text-[9px] w-full font-black uppercase text-pink-600 hover:text-white border border-pink-200 hover:border-pink-500 bg-pink-50 hover:bg-pink-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            >
                              + Wishlist
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Lazy Load trigger element */}
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
