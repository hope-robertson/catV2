import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface UploadResponse {
  message: string
  stagedCount: number
  distributor: string
}

export function useImportData() {
  const queryClient = useQueryClient()

  return useMutation<UploadResponse, Error, FormData>(
    async (formData: FormData) => {
      const response = await fetch('/api/v1/catalogue/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.message || 'Failed to import data.')
      }
      return response.json()
    },
    {
      onSuccess: () => {
        // Invalidate preview queries so the table refreshes
        queryClient.invalidateQueries(['previewStaging'])
      },
    },
  )
}
