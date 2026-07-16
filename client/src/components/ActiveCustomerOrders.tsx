import React, { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/pricing.js'

export default function ActiveCustomerOrders() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const THRESHOLD = 500

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['customerOrders'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/customers/orders/active')
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: number
      field: string
      value: boolean
    }) => {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/customers/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ [field]: value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] })
    },
  })

  // 🎯 New Delete Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/customers/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] })
    },
  })

  const handleToggle = (id: number, field: string, currentValue: boolean) => {
    toggleStatusMutation.mutate({ id, field, value: !currentValue })
  }

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        'Are you sure you want to permanently delete this customer order? This cannot be undone.',
      )
    ) {
      deleteOrderMutation.mutate(id)
    }
  }

  const distributorGroups = useMemo(() => {
    const groups: Record<string, any> = {}

    orders.forEach((order: any) => {
      if (order.is_backburner || order.is_ordered) return

      const dist = order.distributor || 'Unknown'
      if (!groups[dist]) {
        groups[dist] = { total: 0, count: 0, orders: [] }
      }

      groups[dist].total += Number(order.total_value) || 0
      groups[dist].count += 1
      groups[dist].orders.push(order)
    })

    return groups
  }, [orders])

  if (isLoading) {
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-gray-400">
        Loading Demand...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 mt-6 px-4">
      <section>
        <header className="border-b-4 border-gray-900 pb-6 mb-8">
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
            Customer Demand
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Aggregated pending value by distributor
          </p>
        </header>

        {Object.keys(distributorGroups).length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 text-center shadow-sm">
            <p className="text-xs font-black uppercase text-gray-400 tracking-widest">
              No pending un-ordered demand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(distributorGroups).map(
              ([dist, data]: [string, any]) => {
                const isReady = data.total >= THRESHOLD
                return (
                  <div
                    key={dist}
                    className={`p-6 rounded-[32px] border-2 transition-all flex flex-col ${isReady ? 'bg-green-50 border-green-200 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 truncate pr-2">
                        {dist}
                      </h3>
                      {isReady && (
                        <span className="bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse flex-shrink-0">
                          Ready
                        </span>
                      )}
                    </div>

                    <div className="mb-6 flex-grow">
                      <p className="text-[10px] font-black uppercase text-gray-400">
                        Pending Value ({data.count} items)
                      </p>
                      <p
                        className={`text-3xl font-black ${isReady ? 'text-green-700' : 'text-gray-900'}`}
                      >
                        {formatCurrency(data.total)}
                      </p>
                    </div>

                    {/* 🎯 Always allows initialization with dynamic styling */}
                    <div className="mt-auto space-y-3">
                      {!isReady && (
                        <div className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 py-2.5 rounded-xl text-center border border-amber-100">
                          Shortfall: ${formatCurrency(THRESHOLD - data.total)}
                        </div>
                      )}
                      <button
                        onClick={() =>
                          navigate(
                            `/orders/new?dist=${encodeURIComponent(dist)}`,
                          )
                        }
                        className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 ${
                          isReady
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        {isReady ? 'Initialize Mission' : 'Force Initialize'}
                      </button>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-black uppercase tracking-widest text-gray-900">
            Active Dockets
          </h3>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            {orders.length} Records
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-[40px] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest min-w-[250px]">
                    Customer / Items
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center border-l border-white/10">
                    Clerk
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-blue-400 uppercase tracking-widest text-center border-l border-white/10"
                    title="Texted Customer"
                  >
                    TXT
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-blue-400 uppercase tracking-widest text-center"
                    title="Confirmed Price"
                  >
                    CNF
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-orange-400 uppercase tracking-widest text-center"
                    title="Ordered from Supplier"
                  >
                    ORD
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-green-400 uppercase tracking-widest text-center border-l border-white/10"
                    title="Contacted for Pickup"
                  >
                    CON
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-green-400 uppercase tracking-widest text-center"
                    title="Picked Up"
                  >
                    PCK
                  </th>
                  <th
                    className="px-4 py-5 text-[9px] font-black text-red-400 uppercase tracking-widest text-center border-l border-white/10"
                    title="On Backburner"
                  >
                    BB
                  </th>
                  <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center border-l border-white/10">
                    DEL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <tr
                    key={order.docket_id}
                    className={`hover:bg-gray-50 transition-all ${order.is_backburner ? 'opacity-40 grayscale bg-gray-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-500 whitespace-nowrap align-top">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="mb-2">
                        <p className="text-sm font-black text-gray-900 uppercase">
                          {order.customer_name}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-blue-600">
                          {order.phone}
                        </p>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-1.5 border-t border-gray-100 pt-3">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-start text-[10px]"
                            >
                              <div className="pr-4">
                                <span className="font-black text-gray-800">
                                  {item.quantity}x {item.artist}
                                </span>
                                <span className="font-bold text-gray-400 block mt-0.5">
                                  {item.title}
                                </span>
                              </div>
                              <span className="font-mono font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                ${item.quoted_price}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 tracking-widest text-center border-l border-gray-50 align-top">
                      {order.clerk_name}
                    </td>

                    <td className="px-4 py-4 text-center border-l border-gray-50 align-top pt-5">
                      <input
                        type="checkbox"
                        checked={order.is_texted || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_texted',
                            order.is_texted,
                          )
                        }
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center align-top pt-5">
                      <input
                        type="checkbox"
                        checked={order.is_confirmed || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_confirmed',
                            order.is_confirmed,
                          )
                        }
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center align-top pt-5 bg-orange-50/10">
                      <input
                        type="checkbox"
                        checked={order.is_ordered || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_ordered',
                            order.is_ordered,
                          )
                        }
                        className="w-5 h-5 accent-orange-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center border-l border-gray-50 align-top pt-5">
                      <input
                        type="checkbox"
                        checked={order.is_contacted || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_contacted',
                            order.is_contacted,
                          )
                        }
                        className="w-5 h-5 accent-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center align-top pt-5">
                      <input
                        type="checkbox"
                        checked={order.is_picked_up || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_picked_up',
                            order.is_picked_up,
                          )
                        }
                        className="w-5 h-5 accent-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center border-l border-gray-50 align-top pt-5">
                      <input
                        type="checkbox"
                        checked={order.is_backburner || false}
                        onChange={() =>
                          handleToggle(
                            order.docket_id,
                            'is_backburner',
                            order.is_backburner,
                          )
                        }
                        className="w-5 h-5 accent-red-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center border-l border-gray-50 align-top pt-5">
                      <button
                        onClick={() => handleDelete(order.docket_id)}
                        disabled={deleteOrderMutation.isPending}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete Order"
                      >
                        <svg
                          style={{
                            width: '18px',
                            height: '18px',
                            margin: '0 auto',
                          }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-300"
                    >
                      No active records in the pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
