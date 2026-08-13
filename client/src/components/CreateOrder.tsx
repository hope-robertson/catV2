import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { formatCurrency } from '../utils/pricing.js'

export default function CreateOrder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getAccessTokenSilently } = useAuth0()

  const preselectedDist = searchParams.get('dist') || 'Southbound'

  const [form, setForm] = useState({
    name: '',
    budget_limit: 1000,
    distributor: preselectedDist,
  })

  // --- AUTO-LINK STATE ---
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        const token = await getAccessTokenSilently()
        const res = await request
          .get('/api/v1/customers/orders/active')
          .set('Authorization', `Bearer ${token}`)
        setCustomerOrders(res.body || [])
      } catch (err) {
        console.error('Failed to fetch customer orders:', err)
      }
    }
    fetchCustomerOrders()
  }, [getAccessTokenSilently])

  const distributors = [
    'Southbound',
    'Universal Music',
    'Border Music',
    'Collective (LP)',
    'Collective (CD)',
    'Rhythmethod',
    'Sony Music',
    'Warner Music',
  ]

  // --- CALCULATE MATCHING CUSTOMER DEMAND (WHOLESALE COST) ---
  const { matchedDockets, matchedItems, matchedTotal } = useMemo(() => {
    const dockets = customerOrders.filter((o) => {
      if (o.is_ordered || o.is_backburner) return false

      // 🎯 THE FIX: Group Rhythmethod, Sony, and Warner together!
      if (form.distributor === 'Rhythmethod') {
        return ['Rhythmethod', 'Sony Music', 'Warner Music'].includes(
          o.distributor,
        )
      }

      return o.distributor === form.distributor
    })

    const items = dockets.flatMap((d) => d.items || [])
    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0,
    )
    return { matchedDockets: dockets, matchedItems: items, matchedTotal: total }
  }, [customerOrders, form.distributor])

  // Auto-bump the budget if customer demand exceeds the default
  useEffect(() => {
    if (matchedTotal > form.budget_limit) {
      setForm((prev) => ({
        ...prev,
        budget_limit: Math.ceil(matchedTotal / 100) * 100 + 200,
      }))
    }
  }, [matchedTotal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInitializing(true)
    try {
      const token = await getAccessTokenSilently()

      // 1. Create the main shop order
      const orderRes = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(form)

      const newOrderId = orderRes.body.id

      // 2. Automatically inject customer items into the new shop order
      if (matchedItems.length > 0) {
        for (const item of matchedItems) {
          const catalogueId = item.master_catalogue_id || item.id
          if (catalogueId) {
            await request
              .post(`/api/v1/orders/${newOrderId}/items`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                master_catalogue_id: catalogueId,
                quantity: item.quantity,
                ams_price: item.price || 0, // 🎯 Fix: Inject Wholesale price to match manual items
              })
          }
        }
      }

      // Navigate to the catalogue to finish manually picking
      navigate(`/orders/${newOrderId}/catalogue`)
    } catch (err) {
      console.error('Order creation failed:', err)
      alert('Failed to initialize mission.')
      setIsInitializing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-[32px] shadow-xl border border-gray-100">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
          New Supply Mission
        </h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
          Initialize Order Parameters
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
            Reference Name
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Monthly Restock"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
              Distributor
            </label>
            <select
              value={form.distributor}
              onChange={(e) =>
                setForm({ ...form, distributor: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all appearance-none"
            >
              {distributors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
              Budget ($)
            </label>
            <input
              type="number"
              value={form.budget_limit}
              onChange={(e) =>
                setForm({ ...form, budget_limit: Number(e.target.value) })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all font-mono"
            />
          </div>
        </div>

        {/* 🎯 UI: AUTO-LINK NOTIFICATION */}
        {matchedDockets.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex justify-between items-center animate-in fade-in zoom-in duration-300">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Customer Demand Detected
              </p>
              <p className="text-sm font-bold text-gray-800 mt-1 leading-snug">
                {matchedItems.length} records across {matchedDockets.length}{' '}
                dockets
                <br />
                will be auto-injected into this mission.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Wholesale Cost
              </p>
              <p className="text-2xl font-black text-blue-700">
                ${matchedTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isInitializing}
          className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-600 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInitializing
            ? 'Injecting Customer Orders...'
            : 'Initialize Mission →'}
        </button>
      </form>
    </div>
  )
}
