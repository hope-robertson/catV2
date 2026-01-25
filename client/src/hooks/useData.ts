// client/src/hooks/useData.ts
import { useMutation, useQuery } from '@tanstack/react-query' // Updated import
import {
  CatalogueRow,
  MasterCatalogueRow,
  UploadResponse,
  CustomError,
} from '../../../server/types/catalogue.js' // Adjust path as needed

// Hook for importing data
export function useImportData() {
  return useMutation<UploadResponse, CustomError, FormData>(
    async (formData: FormData) => {
      const response = await fetch('/api/v1/catalogue/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw {
          message: errorBody.message || 'Failed to import data.',
          ...errorBody,
        }
      }
      return response.json()
    },
  )
}

// Hook for fetching master catalogue data
export function useMasterCatalogue(distributor?: string, format?: string) {
  return useQuery<MasterCatalogueRow[], CustomError>(
    ['masterCatalogue', distributor, format],
    async () => {
      const params = new URLSearchParams()
      if (distributor) params.append('distributor', distributor)
      if (format) params.append('format', format)

      const response = await fetch(`/api/v1/catalogue/all?${params.toString()}`)
      if (!response.ok) {
        const errorBody = await response.json()
        throw {
          message: errorBody.message || 'Failed to fetch master catalogue.',
          ...errorBody,
        }
      }
      return response.json()
    },
  )
}
