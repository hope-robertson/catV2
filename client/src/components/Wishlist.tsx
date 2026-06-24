import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useNavigate } from 'react-router-dom'

export default function Wishlist() {
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch Wishlist Items
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  // Remove Item from Wishlist
  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/wishlist/${id}`)
        .set('Authorization', `Bearer ${token}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

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
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Personal Stash
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Your saved catalogue items
          </p>
        </div>
        <button
          onClick={() => navigate('/catalogue')}
          className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-sm transition-all active:scale-95"
        >
          Browse Catalogue
        </button>
      </div>

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
                Cost
              </th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {wishlistItems.map((item: any) => (
              <tr
                key={item.wishlist_id}
                className="hover:bg-pink-50/20 transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">
                    {item.artist || 'Various'}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Added: {new Date(item.created_at).toLocaleDateString()}
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
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => removeMutation.mutate(item.wishlist_id)}
                    className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {wishlistItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-gray-300 font-black uppercase tracking-widest text-sm italic">
                    Your wishlist is empty. Start browsing the catalogue to save
                    items.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
