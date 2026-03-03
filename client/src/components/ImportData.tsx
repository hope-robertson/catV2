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
  const [stats, setStats] = useState<{
    count: number | null
    dist: string | null
  }>({
    count: null,
    dist: null,
  })

  const distributors = [
    { name: 'Southbound In-stock', value: 'Southbound' },
    { name: 'Flying Nun Records', value: 'Flying Nun Records Limited' },
    { name: 'Border Music', value: 'Border Music' },
    { name: 'Collective LP', value: 'Collective (LP)' },
    { name: 'Collective CD', value: 'Collective (CD)' },
    { name: 'Rhythmethod Vinyl', value: 'Rhythmethod Group (Vinyl)' },
    { name: 'Rhythmethod CD', value: 'Rhythmethod Group (CD)' },
  ]

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

      if (!uploadRes.ok) throw new Error('Upload failed')
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
      } else {
        alert(`Import Error: ${result.message}`)
      }
    } catch (err: any) {
      alert(`Process failed: ${err.message}`)
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

      if (res.ok) {
        alert('Consolidation Complete')
        setPreviewData([])
        setStats({ count: null, dist: null })
      }
    } catch (err) {
      alert('Consolidation failed')
    } finally {
      setIsConsolidating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded max-w-5xl mx-auto">
        <p className="text-yellow-700">Please log in to manage data imports.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <DataIntegrityDashboard
        fileName={file?.name || null}
        stagedCount={stats.count}
        distributor={stats.dist}
        isConsolidating={isConsolidating}
      />

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Catalogue Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b pb-8">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Upload Distributor File
            </h3>

            <select
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {distributors.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <p className="font-bold mb-1">{distributor} Requirements:</p>
              {distributor === 'Southbound' && (
                <p>
                  Data starts Row 2. Columns: Cat No (A), Title (B), Price (C),
                  Format (D), Barcode (E)
                </p>
              )}
              {distributor === 'Border Music' && (
                <p>
                  Data starts Row 5. Columns: Artist (A), Title (B), Cat (C),
                  Barcode (D), Format (E)
                </p>
              )}
              {distributor === 'Flying Nun Records Limited' && (
                <p>CSV format. Data starts Row 5.</p>
              )}
              {distributor.includes('Collective') && (
                <p>Data starts Row 2. Barcode is Column A.</p>
              )}
              {distributor.includes('Rhythmethod') && (
                <p>Requires multiple sheets. Data starts Row 3.</p>
              )}
            </div>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700"
            />

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold"
            >
              {isUploading ? 'Processing...' : 'Upload to Staging'}
            </button>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Merge to Master
            </h3>
            <p className="text-sm text-gray-500">
              Review results below before merging to the Master Catalogue.
            </p>
            <button
              onClick={handleConsolidate}
              disabled={isConsolidating || previewData.length === 0}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 font-bold"
            >
              {isConsolidating ? 'Merging...' : 'Consolidate to Master'}
            </button>
          </section>
        </div>

        {previewData.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 text-orange-600">
              Scrubber Preview
            </h3>
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Original</th>
                  <th className="p-2 border">Scrubbed</th>
                  <th className="p-2 border">Barcode</th>
                  <th className="p-2 border">Format</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border text-gray-400 italic truncate max-w-xs">
                      {row.original.artist} - {row.original.title}
                    </td>
                    <td className="p-2 border font-medium">
                      {row.scrubbed.artist} - {row.scrubbed.title}
                    </td>
                    <td className="p-2 border font-mono">
                      {row.scrubbed.barcode}
                    </td>
                    <td className="p-2 border">{row.scrubbed.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
