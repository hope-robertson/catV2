import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/pricing.js'

export default function ActiveOrders() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Syncing Manifest...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Procurement Hub
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Active Ordering Sessions
          </p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95"
        >
          + Initialise New Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders?.map((order: any) => (
          <div
            key={order.id}
            className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {order.distributor}
                </span>
                {/* 🎯 FIX: Prioritize order.name over Session #id */}
                <h3 className="text-2xl font-black text-gray-800 mt-3 tracking-tight">
                  {order.name ? order.name : `Session #${order.id}`}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                  Opened: {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Budget
                </p>
                <p className="text-xl font-mono font-bold text-gray-900">
                  {formatCurrency(order.budget_limit)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/orders/${order.id}/catalogue`)}
                className="flex-1 bg-gray-900 group-hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-md"
              >
                Continue Picking
              </button>
              <button
                onClick={() => navigate(`/orders/${order.id}/review`)}
                className="px-6 py-4 border-2 border-gray-100 rounded-2xl font-black uppercase text-[10px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
              >
                Review
              </button>
            </div>
          </div>
        ))}

        {orders?.length === 0 && (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-gray-100 rounded-[40px]">
            <p className="text-gray-300 font-black uppercase tracking-widest text-sm italic">
              No active sessions. The horizon is clear.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
