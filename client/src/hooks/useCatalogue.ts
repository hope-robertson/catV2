import { useState } from 'react'
import { searchCatalogue, updateRating } from '../../apis/catalogue.js'
import { MasterCatalogueRow } from '../../models/catalogue.js'

export function useCatalogue() {
  const [results, setResults] = useState<MasterCatalogueRow[]>([])
  const [loading, setLoading] = useState(false)

  const performSearch = async (query: string, filter: string) => {
    setLoading(true)
    try {
      const data = await searchCatalogue(query, filter)
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingUpdate = async (id: number, rating: number) => {
    try {
      await updateRating(id, rating)
      // Optimistic UI update: change the state immediately so it feels snappy
      setResults((prev) =>
        prev.map((item) => (item.id === id ? { ...item, rating } : item)),
      )
    } catch (err) {
      console.error('Failed to update rating:', err)
    }
  }

  return { results, loading, performSearch, handleRatingUpdate }
}
