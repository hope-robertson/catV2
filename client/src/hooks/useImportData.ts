import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { API_BASE } from '../config.js'

export interface UploadResponse {
  message: string
  stagedCount: number
  distributor: string
}

export function useImportData() {
  const queryClient = useQueryClient()
  const { getAccessTokenSilently } = useAuth0()

  return useMutation<UploadResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${API_BASE}/api/v1/catalogue/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.message || 'Failed to import data.')
      }
      return response.json()
    },
    onSuccess: () => {
      // ✨ The fix: Pass queryKey inside an object
      queryClient.invalidateQueries({ queryKey: ['previewStaging'] })
    },
  })
}
