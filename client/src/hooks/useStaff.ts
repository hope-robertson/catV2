import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { API_BASE } from '../config.js'

export interface StaffProfile {
  id: number
  auth_id: string
  name: string
  // 🎯 UPDATED: We use the boolean now, not the 'role' string
  is_admin: boolean
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
          .get(`${API_BASE}/api/v1/staff/me`)
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
    // 🎯 UPDATED: Logic now looks for the boolean flags
    isAdmin: query.data?.is_admin || false,
    isTrusted: query.data?.is_trusted_orderer || query.data?.is_admin || false,
    needsOnboarding: query.data?.has_completed_onboarding === false,
  }
}
