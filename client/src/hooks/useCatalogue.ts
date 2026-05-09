import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { searchCatalogue, getFullMasterList } from '../apis/catalogue.js'
import { MasterCatalogueRow } from '../models/catalogue.js'

export function useCatalogue() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [results, setResults] = useState<MasterCatalogueRow[]>([])
  const [loading, setLoading] = useState(false)

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

  const performSearch = async (
    query: string,
    filter: string,
    sort: string = 'artist',
  ) => {
    setLoading(true)
    try {
      const token = await getAccessTokenSilently()

      let data: MasterCatalogueRow[]

      if (!query && (filter === 'All' || !filter) && sort === 'artist') {
        data = await getFullMasterList(token)
      } else {
        // Updated to pass sort parameter to the API function
        data = await searchCatalogue(query, filter, sort, token)
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
