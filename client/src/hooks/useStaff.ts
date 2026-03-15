import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export interface StaffProfile {
  id: number
  auth_id: string
  name: string
  role: 'admin' | 'user'
  is_trusted_orderer: boolean
  has_completed_onboarding: boolean
}

export function useStaff() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  const query = useQuery({
    queryKey: ['staffProfile'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/staff/me') // We'll create this route next
        .set('Authorization', `Bearer ${token}`)
      return res.body as StaffProfile
    },
    enabled: isAuthenticated, // Only fetch if logged in via Auth0
  })

  return {
    ...query,
    isAdmin: query.data?.role === 'admin',
    isTrusted: query.data?.is_trusted_orderer || query.data?.role === 'admin',
    needsOnboarding: query.data?.has_completed_onboarding === false,
  }
}
