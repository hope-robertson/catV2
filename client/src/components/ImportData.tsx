// client/src/components/ImportData.tsx
import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react' // 👈 Add this

export default function ImportData() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0() // 👈 Add this
  const [file, setFile] = useState<File | null>(null)
  const [distributor, setDistributor] = useState('southbound_instock')
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isConsolidating, setIsConsolidating] = useState(false)

  // Full list of your current distributors
  const distributors = [
    { name: 'Southbound In-stock', value: 'southbound_instock' },
    { name: 'Flying Nun Records', value: 'flying_nun_records_limited' },
    { name: 'Border Music', value: 'border_music' },
    {
      name: 'Rhythmethod Group (Sony/Warner)',
      value: 'rhythmethod_group_combined',
    },
    { name: 'Collective LP', value: 'collective_lp' },
    { name: 'Collective CD', value: 'collective_cd' },
  ]

  const handleUpload = async () => {
    if (!isAuthenticated) return alert('Please log in first')
    if (!file) return alert('Please select a file first')

    setIsUploading(true)
    try {
      const token = await getAccessTokenSilently() // 🔑 Fetch secure token

      const response = await fetch('/api/v1/catalogue/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 🔑 Send token to backend
        },
        body: JSON.stringify({ filename: file.name, distributor }),
      })

      if (response.ok) {
        alert('Upload registered! Generating preview...')
        fetchPreview()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message}`)
      }
    } catch (err) {
      console.error(err)
      alert('Upload failed. Are you logged in?')
    } finally {
      setIsUploading(false)
    }
  }

  const fetchPreview = async () => {
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch('/api/v1/catalogue/preview-staging', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPreviewData(data)
    } catch (err) {
      console.error('Preview failed', err)
    }
  }

  const handleConsolidate = async () => {
    if (
      !window.confirm(
        'Data looks good? This will merge into the Master Catalogue.',
      )
    )
      return
    setIsConsolidating(true)
    try {
      const token = await getAccessTokenSilently()
      await fetch('/api/v1/catalogue/consolidate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      alert('Consolidation Complete!')
      setPreviewData([])
    } catch (err) {
      alert('Consolidation failed')
    } finally {
      setIsConsolidating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {!isAuthenticated ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
          <p className="text-yellow-700 font-medium">
            Please log in using the button above to manage data imports.
          </p>
        </div>
      ) : (
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
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold"
              >
                {isUploading ? 'Registering...' : 'Upload to Staging'}
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
                Review the preview below before merging into the searchable
                catalogue.
              </p>
              <button
                onClick={handleConsolidate}
                disabled={isConsolidating || previewData.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 font-bold"
              >
                {isConsolidating ? 'Merging...' : 'Consolidate to Master'}
              </button>
            </section>
          </div>

          {/* PREVIEW TABLE (Existing Logic) */}
          {previewData.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">
                Visual Scan: Before & After Scrubber
              </h3>
              <table className="w-full text-left text-sm border-collapse">
                {/* ... table head and body as before ... */}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
