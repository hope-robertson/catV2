import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { calculateRetail, formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CatalogueList() {
  const { id } = useParams()
  const { getAccessTokenSilently } = useAuth0()
  const { results, performSearch } = useCatalogue()

  const [distFilter, setDistFilter] = useState('All')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [dbTotal, setDbTotal] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [sessionName, setSessionName] = useState('')
  const [sortOrder, setSortOrder] = useState<'low' | 'high'>('low')

  const syncOrderContext = async () => {
    if (!id) return
    try {
      const token = await getAccessTokenSilently()
      const orderRes = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setBudgetLimit(orderRes.body.budget_limit)
      setSessionName(orderRes.body.name)
      setDistFilter(orderRes.body.distributor)

      // Auto-filter search
      performSearch('', orderRes.body.distributor)

      const statsRes = await request
        .get(`/api/v1/orders/${id}/stats`)
        .set('Authorization', `Bearer ${token}`)
      setDbTotal(statsRes.body.total || 0)
      setDbCount(statsRes.body.count || 0)
    } catch (err) {
      console.error('❌ Sync failed:', err)
    }
  }

  useEffect(() => {
    syncOrderContext()
  }, [id])

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
      console.error(err)
    }
  }

  const processedResults = [...results]
    .filter(
      (item) => distFilter === 'All' || item.source_distributor === distFilter,
    )
    .sort((a, b) => {
      const priceA = a.price ?? 0
      const priceB = b.price ?? 0
      return sortOrder === 'low' ? priceA - priceB : priceB - priceA
    })

  const remaining = budgetLimit - dbTotal
  const percentUsed = Math.min((dbTotal / budgetLimit) * 100, 100)

  return (
    <div className="relative space-y-6 pb-20 pr-72">
      <div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
          {sessionName || `Session #${id}`}
        </h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          {distFilter} Records
        </p>
      </div>

      {/* 🚀 TOP RIGHT HUD */}
      <div className="fixed top-24 right-6 w-64 z-50">
        <div className="bg-gray-900 shadow-2xl rounded-3xl p-5 text-white border-2 border-white/10 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Spend
              </p>
              <p className="text-xl font-black">{formatCurrency(dbTotal)}</p>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-green-400 h-full transition-all duration-700"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                  Available
                </p>
                <p
                  className={`text-sm font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                  Units
                </p>
                <p className="text-sm font-bold">{dbCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-50 flex gap-4 items-center">
        <div className="flex-1">
          <SearchBar onSearch={(q) => performSearch(q, distFilter)} />
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === 'low' ? 'high' : 'low')}
          className="px-4 py-2 bg-gray-100 rounded-lg text-[10px] font-black uppercase"
        >
          Price: {sortOrder === 'low' ? 'Low → High' : 'High → Low'}
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-left">
                Artist / Title
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">
                Wholesale
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedResults.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900 uppercase leading-none">
                    {item.artist || 'VARIOUS'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{item.title}</p>
                </td>
                <td className="px-6 py-4 text-right text-xs font-mono">
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
                      className="w-12 p-2 border border-gray-200 rounded-lg text-xs font-black text-center"
                    />
                    <button
                      onClick={() => handleAddToOrder(item)}
                      className="bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase shadow-sm active:scale-95"
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
    </div>
  )
}
