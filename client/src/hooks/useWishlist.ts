import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { API_BASE } from '../config.js'

export interface WishlistItem {
  wishlist_id: number
  created_at: string
  id: number // master_catalogue.id
  artist: string
  title: string
  format: string
  price: number
  source_distributor: string
}

export function useWishlist() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`${API_BASE}/api/v1/wishlist`)
        .set('Authorization', `Bearer ${token}`)
      return res.body as WishlistItem[]
    },
    enabled: isAuthenticated,
  })
}

export function useAddToWishlist() {
  const queryClient = useQueryClient()
  const { getAccessTokenSilently } = useAuth0()

  return useMutation({
    mutationFn: async (master_catalogue_id: number) => {
      const token = await getAccessTokenSilently()
      const res = await request
        .post(`${API_BASE}/api/v1/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ master_catalogue_id })
      return res.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  const { getAccessTokenSilently } = useAuth0()

  return useMutation({
    mutationFn: async (wishlist_id: number) => {
      const token = await getAccessTokenSilently()
      const res = await request
        .delete(`${API_BASE}/api/v1/wishlist/${wishlist_id}`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}
