import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/pricing.js'

export default function ActiveCustomerOrders() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()

  // Fetch pending customer orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['customerOrders'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/customer-orders') // Assuming this endpoint exists
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  // Grouping Logic: Aggregate orders by distributor/source
  const distributorGroups = useMemo(() => {
    const groups: any = {}
    orders.forEach((order: any) => {
      const dist = order.distributor || 'Unknown'
      if (!groups[dist]) groups[dist] = { total: 0, count: 0, orders: [] }
      groups[dist].total += order.total_value
      groups[dist].count += 1
      groups[dist].orders.push(order)
    })
    return groups
  }, [orders])

  const THRESHOLD = 500

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-gray-400">
        Loading Demand...
      </div>
    )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="border-b-4 border-gray-900 pb-6">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
          Customer Demand
        </h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
          Aggregated order values by distributor
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(distributorGroups).map(
          ([dist, data]: [string, any]) => {
            const isReady = data.total >= THRESHOLD
            return (
              <div
                key={dist}
                className={`p-6 rounded-[32px] border-2 transition-all ${isReady ? 'bg-green-50 border-green-200 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                    {dist}
                  </h3>
                  {isReady && (
                    <span className="bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                      Ready
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase text-gray-400">
                    Pending Value
                  </p>
                  <p
                    className={`text-2xl font-black ${isReady ? 'text-green-700' : 'text-gray-900'}`}
                  >
                    {formatCurrency(data.total)}
                  </p>
                </div>

                {isReady ? (
                  <button
                    onClick={() =>
                      navigate(`/orders/new?dist=${encodeURIComponent(dist)}`)
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Start Mission
                  </button>
                ) : (
                  <div className="text-[10px] font-bold text-gray-400 uppercase italic">
                    Need ${formatCurrency(THRESHOLD - data.total)} more
                  </div>
                )}
              </div>
            )
          },
        )}
      </div>
    </div>
  )
}
