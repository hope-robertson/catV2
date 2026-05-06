import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import request from 'superagent'
import { useAuth0 } from '@auth0/auth0-react'
import { formatCurrency } from '../utils/pricing.js'

export default function OrderReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const [sliderVal, setSliderVal] = useState(0)

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
            onChange={(e) => setSliderVal(Number(e.target.value))}
            onMouseUp={() => updateBudget(sliderVal)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
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
            className="px-6 py-3 border-2 border-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
          >
            ← Back
          </button>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
            Finalize & Export
          </button>
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
