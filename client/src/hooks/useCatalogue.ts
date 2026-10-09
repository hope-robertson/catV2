import { useState, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { MasterCatalogueRow } from '../models/catalogue.js'
import { API_BASE } from '../config.js'

export function useCatalogue() {
  const { getAccessTokenSilently } = useAuth0()
  const [results, setResults] = useState<MasterCatalogueRow[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const performSearch = useCallback(
    async (
      query: string,
      distributor: string,
      sort: string,
      format: string,
      offset: number = 0,
    ) => {
      setLoading(true)
      try {
        const token = await getAccessTokenSilently()
        const res = await request
          .get(`${API_BASE}/api/v1/catalogue/search`)
          .set('Authorization', `Bearer ${token}`)
          .query({ q: query, distributor, sort, format, offset })

        const newItems = res.body

        // 🎯 If we got fewer than 50 items, we've reached the end
        if (newItems.length < 50) setHasMore(false)
        else setHasMore(true)

        // 🎯 If offset is 0, it's a fresh search (replace). Otherwise, append.
        setResults((prev) => (offset === 0 ? newItems : [...prev, ...newItems]))
      } catch (err) {
        console.error('Lazy load failed:', err)
      } finally {
        setLoading(false)
      }
    },
    [getAccessTokenSilently],
  )

  return { results, loading, hasMore, performSearch }
}
