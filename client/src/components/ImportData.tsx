import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import DataIntegrityDashboard from './DataIntegrityDashboard.js'

export default function ImportData() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [file, setFile] = useState<File | null>(null)
  const [distributor, setDistributor] = useState('Southbound')
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [masterTotal, setMasterTotal] = useState<number>(0)
  const [collisionCount, setCollisionCount] = useState<number>(0)
  const [stats, setStats] = useState<{
    count: number | null
    dist: string | null
  }>({ count: null, dist: null })

  // 🎯 UPDATED: Removed Flying Nun, Added Universal Music
  const distributors = [
    { name: 'Southbound In-stock', value: 'Southbound' },
    { name: 'Universal Music', value: 'UNIVERSAL' },
    { name: 'Border Music', value: 'Border Music' },
    { name: 'Collective LP', value: 'Collective (LP)' },
    { name: 'Collective CD', value: 'Collective (CD)' },
    { name: 'Rhythmethod (SOH)', value: 'Rhythmethod' },
    { name: 'Sony Music (SOH)', value: 'Sony Music' },
    { name: 'Warner Music (SOH)', value: 'Warner Music' },
  ]

  const fetchMasterStats = async () => {
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch('/api/v1/catalogue/master-stats', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch stats')

      const data = await res.json()
      setMasterTotal(data.total ?? 0)

      const colRes = await fetch('/api/v1/catalogue/collisions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const collisions = await colRes.json()
      setCollisionCount(collisions.length || 0)
    } catch (err) {
      console.error('📊 Dashboard Sync Error:', err)
      setMasterTotal(0)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchMasterStats()
  }, [isAuthenticated])

  useEffect(() => {
    setPreviewData([])
  }, [distributor])

  const handleUpload = async () => {
    if (!isAuthenticated || !file) return alert('Selection required')
    setIsUploading(true)
    try {
      const token = await getAccessTokenSilently()
      const formData = new FormData()
      formData.append('stockFile', file)
      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const { filename } = await uploadRes.json()
      const importRes = await fetch('/api/v1/catalogue/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename, distributor }),
      })
      const result = await importRes.json()
      if (importRes.ok) {
        setStats({ count: result.stagedCount, dist: result.distributor })
        fetchPreview()
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const fetchPreview = async () => {
    const token = await getAccessTokenSilently()
    const res = await fetch('/api/v1/catalogue/preview-staging', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setPreviewData(data)
  }

  const handleConsolidate = async () => {
    if (!window.confirm('Merge data into Master?')) return
    setIsConsolidating(true)
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch('/api/v1/catalogue/consolidate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()

      if (res.ok) {
        setPreviewData([])
        setStats({ count: null, dist: null })
        await fetchMasterStats()
        alert(`Consolidation Complete! ${result.count} items added to Master.`)
      }
    } catch (err) {
      alert('Consolidation failed')
    } finally {
      setIsConsolidating(false)
    }
  }

  const handleClearStaging = async () => {
    if (!window.confirm('Wipe all data in staging?')) return
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch('/api/v1/catalogue/clear-staging', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPreviewData([])
        setStats({ count: null, dist: null })
        alert('Staging cleared.')
      }
    } catch (err) {
      alert('Clear failed')
    }
  }

  if (!isAuthenticated)
    return (
      <div className="p-4 text-yellow-700 bg-yellow-50 font-bold uppercase tracking-widest text-xs">
        System Lock: Please log in to access the bridge.
      </div>
    )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-gray-900 text-white p-5 rounded-xl shadow-lg">
        <h1 className="text-xl font-bold tracking-tight uppercase tracking-tighter">
          Catalogue Staging
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
            Total Master Items
          </span>
          <span className="bg-green-600 px-4 py-1 rounded-full text-lg font-mono font-bold">
            {masterTotal?.toLocaleString() ?? '0'}
          </span>
        </div>
      </div>

      <DataIntegrityDashboard
        fileName={file?.name || null}
        stagedCount={stats.count}
        distributor={stats.dist}
        isConsolidating={isConsolidating}
        collisionCount={collisionCount}
      />

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b pb-8">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-black">
                1
              </span>
              Upload Distributor File
            </h3>
            <select
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-sm outline-none focus:border-blue-500 transition-all"
            >
              {distributors.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 file:font-black"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-blue-700 transition-all shadow-lg active:scale-[0.95]"
            >
              {isUploading ? 'Syncing...' : 'Upload to Staging'}
            </button>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-black">
                2
              </span>
              Merge to Master
            </h3>
            <button
              onClick={handleConsolidate}
              disabled={isConsolidating || previewData.length === 0}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-green-700 transition-all shadow-lg active:scale-[0.95] disabled:opacity-30"
            >
              {isConsolidating ? 'Consolidating...' : 'Consolidate to Master'}
            </button>
            <button
              onClick={handleClearStaging}
              className="w-full border-2 border-dashed border-red-100 text-red-400 py-3 rounded-xl font-black uppercase text-[10px] hover:bg-red-50 hover:text-red-600 transition-all"
            >
              Clear Staging Area
            </button>
          </section>
        </div>

        {previewData.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-black mb-4 text-orange-600 flex items-center gap-2 uppercase tracking-widest">
              Scrubber Preview
              <span className="text-[10px] font-bold text-gray-300 uppercase">
                (Validating Logic)
              </span>
            </h3>
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-4 border-b">Source String</th>
                    <th className="p-4 border-b text-blue-600">
                      Scrubbed Artist
                    </th>
                    <th className="p-4 border-b text-blue-600">
                      Scrubbed Title
                    </th>
                    <th className="p-4 border-b text-right">Wholesale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="p-4 text-gray-400 italic text-xs max-w-[200px] truncate">
                        {row.original.artist || ''} {row.original.title || ''}
                      </td>
                      <td className="p-4 font-black text-gray-900 border-l-4 border-blue-500 bg-blue-50/10">
                        {row.scrubbed.artist}
                      </td>
                      <td className="p-4 text-gray-600 font-bold">
                        {row.scrubbed.title}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-green-700">
                        {row.scrubbed.price
                          ? `$${row.scrubbed.price.toFixed(2)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
