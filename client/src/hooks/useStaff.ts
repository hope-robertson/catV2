// client/src/hooks/useStaff.ts
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
      console.log('🔍 [useStaff] Fetching profile...')
      try {
        const token = await getAccessTokenSilently()
        const res = await request
          .get('/api/v1/staff/me')
          .set('Authorization', `Bearer ${token}`)

        console.log('✅ [useStaff] Success:', res.body)
        return res.body as StaffProfile
      } catch (err: any) {
        console.error('❌ [useStaff] Error:', err.response?.body || err.message)
        throw err
      }
    },
    enabled: isAuthenticated,
  })

  return {
    ...query,
    isAdmin: query.data?.role === 'admin',
    isTrusted: query.data?.is_trusted_orderer || query.data?.role === 'admin',
    needsOnboarding: query.data?.has_completed_onboarding === false,
  }
}
