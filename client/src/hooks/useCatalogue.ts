import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  searchCatalogue,
  getFullMasterList,
  updateRating,
} from '../apis/catalogue.js'
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

  const performSearch = async (query: string, filter: string) => {
    setLoading(true)
    try {
      const token = await getAccessTokenSilently()
      const data = await searchCatalogue(query, filter, token)
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingUpdate = async (id: number, rating: number) => {
    try {
      const token = await getAccessTokenSilently()
      await updateRating(id, rating, token)
      setResults((prev) =>
        prev.map((item) => (item.id === id ? { ...item, rating } : item)),
      )
    } catch (err) {
      console.error('Failed to update rating:', err)
    }
  }

  return { results, loading, performSearch, handleRatingUpdate }
}
