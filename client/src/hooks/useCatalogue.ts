import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { searchCatalogue, getFullMasterList } from '../apis/catalogue.js'
import { MasterCatalogueRow } from '../models/catalogue.js'

export function useCatalogue() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [results, setResults] = useState<MasterCatalogueRow[]>([])
  const [loading, setLoading] = useState(false)

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        setLoading(true)
        try {
          const token = await getAccessTokenSilently()
          const data = await getFullMasterList(token)
          setResults(data)
        } catch (err) {
          console.error('Failed to load initial catalogue:', err)
        } finally {
          setLoading(false)
        }
      }
      loadInitialData()
    }
  }, [isAuthenticated, getAccessTokenSilently])

  const performSearch = async (query: string, filter: string) => {
    setLoading(true)
    try {
      const token = await getAccessTokenSilently()

      let data: MasterCatalogueRow[]

      // 🎯 THE FIX: Switch logic if the search is cleared
      if (!query && (filter === 'All' || !filter)) {
        console.log('🔄 Resetting to full master list...')
        data = await getFullMasterList(token)
      } else {
        console.log(`📡 Searching for "${query}" with filter "${filter}"`)
        data = await searchCatalogue(query, filter, token)
      }

      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, performSearch }
}
