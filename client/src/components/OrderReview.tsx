import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import request from 'superagent'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from '../hooks/useStaff.js' // 🎯 Added staff hook
import { formatCurrency } from '../utils/pricing.js'

export default function OrderReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const [sliderVal, setSliderVal] = useState(0)

  // 🎯 Extract privileges
  const { isTrusted } = useStaff()

  const { data: orderHeader, refetch: refetchHeader } = useQuery({
    queryKey: ['orderHeader', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setSliderVal(res.body.budget_limit)
      return res.body
    },
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: ['orderSummary', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}/summary`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  const updateBudget = async (newVal: number) => {
    // Junior staff shouldn't be firing off budget updates
    if (!isTrusted) return
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ budget_limit: newVal })
      await refetchHeader()
    } catch (err) {
      console.error('🔥 Patch failed:', err)
    }
  }

  // 🎯 Wired up Finalize logic
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

  // 🎯 Added Abort logic
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
      navigate('/')
    } catch (err) {
      console.error('Delete order failed')
    }
  }

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-gray-400">
        Syncing Manifest...
      </div>
    )

  const items = summary?.items || []
  const stats = summary?.stats || { totalCost: 0 }
  const remaining = sliderVal - stats.totalCost

  return (
    <div className="relative max-w-5xl mx-auto mt-10 space-y-8 pb-20 px-4 pr-80">
      {/* 🚀 TOP RIGHT HUD (Budget Slider) */}
      <div className="fixed top-24 right-6 w-72 z-50">
        <div className="bg-gray-900 shadow-2xl rounded-[32px] p-6 text-white border-2 border-white/10">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4">
            Budget Control
          </p>
          <input
            type="range"
            min="0"
            max="4000"
            step="50"
            value={sliderVal}
            onChange={(e) => isTrusted && setSliderVal(Number(e.target.value))}
            onMouseUp={() => isTrusted && updateBudget(sliderVal)}
            disabled={!isTrusted} // 🎯 Disables slider for junior staff
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none mb-2 ${isTrusted ? 'cursor-pointer accent-blue-500' : 'cursor-not-allowed opacity-50'}`}
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-4">
            <span>$0</span>
            <span className="text-white font-black text-sm">${sliderVal}</span>
            <span>$4000</span>
          </div>
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between">
              <span className="text-[9px] font-black uppercase opacity-50">
                Spend
              </span>
              <span className="text-sm font-bold">
                {formatCurrency(stats.totalCost)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Available
              </span>
              <span
                className={`text-sm font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}
              >
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end border-b-4 border-gray-900 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Review
          </h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">
            {orderHeader?.distributor} • Session #{id}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/orders/${id}/catalogue`)}
            className="px-6 py-3 border-2 border-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95"
          >
            ← Back
          </button>

          {/* 🎯 UI GUARD: Only render Finalize and Abort if isTrusted */}
          {isTrusted && (
            <>
              <button
                onClick={handleFinalize}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
              >
                Finalize & Export
              </button>
              <button
                onClick={handleDeleteOrder}
                className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                title="Abort Mission"
              >
                <svg
                  style={{ width: '14px', height: '14px' }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Abort
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-left">
                Artist / Title
              </th>
              <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Qty
              </th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item: any) => (
              <tr
                key={item.item_id}
                className="hover:bg-blue-50/20 transition-colors"
              >
                <td className="px-8 py-6">
                  <p className="font-black text-gray-900 uppercase text-sm leading-none">
                    {item.artist}
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    {item.title}
                  </p>
                  <p className="text-[9px] font-black text-blue-500 uppercase mt-1">
                    By: {item.staff_member || 'System'}
                  </p>
                </td>
                <td className="px-8 py-6 text-center font-mono font-bold text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-8 py-6 text-right font-mono font-bold text-gray-600">
                  {formatCurrency(item.ams_price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
