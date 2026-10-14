import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config.js'
import { formatCurrency } from '../utils/pricing.js'

export default function Wishlist() {
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Modal State for adding an item to an active order
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Fetch Wishlist Items
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`${API_BASE}/api/v1/wishlist`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  // 2. Fetch Active Orders for the Modal Dropdown/List
  const { data: activeOrders = [] } = useQuery({
    queryKey: ['activeOrdersModal'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`${API_BASE}/api/v1/orders`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
    enabled: !!selectedItem, // Only fetch when modal is open
  })

  // Remove Item from Wishlist
  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getAccessTokenSilently()
      await request
        .delete(`${API_BASE}/api/v1/wishlist/${id}`)
        .set('Authorization', `Bearer ${token}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Add Item to Active Order Mutation
  const addToOrderMutation = useMutation({
    mutationFn: async ({ orderId, catalogId, price }: { orderId: number, catalogId: number, price: number }) => {
      const token = await getAccessTokenSilently()
      await request
        .post(`${API_BASE}/api/v1/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          master_catalogue_id: catalogId,
          quantity: 1,
          ams_price: price || 0,
        })
    },
    onSuccess: () => {
      setSuccessMsg('Item successfully added to order!')
      setTimeout(() => {
        setSuccessMsg(null)
        setSelectedItem(null)
      }, 1500)
    },
  })

  // 🎯 Group wishlist items by distributor
  const groupedWishlist = useMemo(() => {
    const groups: Record<string, any[]> = {}
    wishlistItems.forEach((item: any) => {
      let dist = item.source_distributor || 'Unknown Distributor'
      if (!groups[dist]) {
        groups[dist] = []
      }
      groups[dist].push(item)
    })
    return groups
  }, [wishlistItems])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Loading Wishlist...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 pb-20">
      {/* 🚀 ADD TO ORDER MODAL POPUP */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border-4 border-pink-100 space-y-6">
            <div>
              <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                Add to Active Mission
              </span>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-3">
                {selectedItem.artist} - {selectedItem.title}
              </h3>
              <p className="text-xs font-bold text-gray-400 mt-1">
                Select an in-progress order below to inject this item:
              </p>
            </div>

            {successMsg ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center animate-pulse">
                {successMsg}
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {activeOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 bg-gray-50 hover:bg-pink-50 border-2 border-gray-100 hover:border-pink-200 rounded-2xl flex justify-between items-center transition-all cursor-pointer group"
                    onClick={() =>
                      addToOrderMutation.mutate({
                        orderId: order.id,
                        catalogId: selectedItem.id,
                        price: selectedItem.price,
                      })
                    }
                  >
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase group-hover:text-pink-600 transition-colors">
                        {order.name || `Session #${order.id}`}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                        {order.distributor} • Limit: {formatCurrency(order.budget_limit)}
                      </p>
                    </div>
                    <span className="bg-gray-900 group-hover:bg-pink-600 text-white text-[9px] font-black px-3 py-2 rounded-xl uppercase tracking-widest transition-colors shadow-sm">
                      Select →
                    </span>
                  </div>
                ))}

                {activeOrders.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      No active procurement sessions found.
                    </p>
                    <button
                      onClick={() => navigate('/orders/new')}
                      className="mt-3 text-[9px] font-black uppercase tracking-widest text-pink-600 hover:underline"
                    >
                      + Initialize New Mission
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedItem(null)
                setSuccessMsg(null)
              }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Personal Stash
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Your saved catalogue items grouped by distributor
          </p>
        </div>
        <button
          onClick={() => navigate('/catalogue')}
          className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-sm transition-all active:scale-95"
        >
          Browse Catalogue
        </button>
      </div>

      {/* 📦 DISTRIBUTOR SECTIONS */}
      {Object.keys(groupedWishlist).length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] border-2 border-dashed border-gray-200 text-center shadow-sm">
          <p className="text-gray-300 font-black uppercase tracking-widest text-sm italic">
            Your wishlist is empty. Start browsing the catalogue to save items.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedWishlist).map(([distributor, items]: [string, any[]]) => (
            <div key={distributor} className="bg-white shadow-xl rounded-[40px] overflow-hidden border border-gray-100">
              <div className="bg-gray-900 px-8 py-4 flex justify-between items-center text-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-pink-400">
                  {distributor}
                </h3>
                <span className="bg-white/10 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                      Artist / Title
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                      Format
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-right tracking-widest">
                      Cost
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item: any) => (
                    <tr
                      key={item.wishlist_id}
                      className="hover:bg-pink-50/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900">
                          {item.artist || 'Various'}
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-0.5">
                          {item.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                            item.format?.includes('LP')
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {item.format || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-[9px] font-black uppercase text-white bg-pink-600 hover:bg-pink-500 px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
                          >
                            + Add to Order
                          </button>
                          <button
                            onClick={() => removeMutation.mutate(item.wishlist_id)}
                            className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}