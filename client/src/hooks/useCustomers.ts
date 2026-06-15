import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export interface Customer {
  id: number
  name: string
  phone: string
  email?: string
}

export interface CustomerOrderItem {
  master_catalogue_id: number
  quantity: number
  quoted_price: number
  base_usd_price?: number
  exchange_rate_used?: number
}

// 🎯 Fetch Active Customer Dockets
export function useActiveCustomerOrders() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  return useQuery({
    queryKey: ['activeCustomerOrders'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/customers/orders/active')
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
    enabled: isAuthenticated,
  })
}

// 🎯 Search Existing Customers (Prevents Duplicates)
export function useSearchCustomers(query: string) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  return useQuery({
    queryKey: ['searchCustomers', query],
    queryFn: async () => {
      if (!query) return []
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/customers/search')
        .query({ q: query })
        .set('Authorization', `Bearer ${token}`)
      return res.body as Customer[]
    },
    enabled: isAuthenticated && query.length > 1, // Only search after 2 chars
  })
}

// 🎯 Create a New Customer
export function useCreateCustomer() {
  const { getAccessTokenSilently } = useAuth0()

  return useMutation({
    mutationFn: async (customerData: {
      name: string
      phone: string
      email?: string
    }) => {
      const token = await getAccessTokenSilently()
      const res = await request
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(customerData)
      return res.body as Customer
    },
  })
}

// 🎯 Create the Final Order Docket
export function useCreateCustomerOrder() {
  const queryClient = useQueryClient()
  const { getAccessTokenSilently } = useAuth0()

  return useMutation({
    mutationFn: async ({
      customerId,
      items,
      notes,
    }: {
      customerId: number
      items: CustomerOrderItem[]
      notes?: string
    }) => {
      const token = await getAccessTokenSilently()
      const res = await request
        .post(`/api/v1/customers/${customerId}/orders`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items, notes })
      return res.body
    },
    onSuccess: () => {
      // Instantly refresh the active orders dashboard when a new one is saved!
      queryClient.invalidateQueries({ queryKey: ['activeCustomerOrders'] })
    },
  })
}
