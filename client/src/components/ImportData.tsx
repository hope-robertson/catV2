import React, { useState, useEffect } from 'react'

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null)
  const [distributor, setDistributor] = useState('Southbound')
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isConsolidating, setIsConsolidating] = useState(false)

  // 1. Handle the File Upload (To Staging)
  const handleUpload = async () => {
    if (!file) return alert('Please select a file first')

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file) // Note: Your backend needs to handle multipart/form-data
    formData.append('distributor', distributor)

    try {
      // Assuming your backend 'import' route handles the actual file moving
      const response = await fetch('/api/v1/catalogue/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, distributor }),
      })

      if (response.ok) {
        alert('Upload successful! Generating preview...')
        fetchPreview()
      }
    } catch (err) {
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // 2. Fetch the "Before & After" Preview
  const fetchPreview = async () => {
    const res = await fetch('/api/v1/catalogue/preview-staging')
    const data = await res.json()
    setPreviewData(data)
  }

  // 3. Final Consolidation (To Master)
  const handleConsolidate = async () => {
    if (
      !window.confirm(
        'Data looks good? This will merge into the Master Catalogue.',
      )
    )
      return
    setIsConsolidating(true)
    try {
      await fetch('/api/v1/catalogue/consolidate', { method: 'POST' })
      alert('Consolidation Complete!')
      setPreviewData([]) // Clear preview after success
    } catch (err) {
      alert('Consolidation failed')
    } finally {
      setIsConsolidating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Catalogue Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b pb-8">
          {/* SECTION 1: UPLOAD */}
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
              <option value="Southbound">Southbound</option>
              <option value="Flying Nun">Flying Nun</option>
              <option value="Rhythmethod">Rhythmethod</option>
            </select>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isUploading ? 'Uploading...' : 'Upload to Staging'}
            </button>
          </section>

          {/* SECTION 2: CONSOLIDATE */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Merge to Master
            </h3>
            <p className="text-sm text-gray-500">
              Review the data in the table below. If it looks correct, click
              consolidate to finalize the import.
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

        {/* SECTION 3: PREVIEW TABLE */}
        {previewData.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 text-orange-600">
              Visual Scan: Before & After Scrubber
            </h3>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2">Field</th>
                  <th className="p-2">Raw Data (From File)</th>
                  <th className="p-2">Scrubbed Data (Proposed)</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="border-t bg-gray-50/50">
                      <td className="p-2 font-bold text-gray-400" colSpan={3}>
                        Record #{idx + 1}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-gray-500 italic">Artist</td>
                      <td className="p-2">{item.original.artist}</td>
                      <td className="p-2 text-green-700 font-medium">
                        {item.scrubbed.artist}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-gray-500 italic">Barcode</td>
                      <td className="p-2 text-red-400">
                        {item.original.barcode}
                      </td>
                      <td className="p-2 text-blue-700 font-mono">
                        {item.scrubbed.barcode}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-gray-500 italic">NZ Music</td>
                      <td className="p-2">{String(item.original.is_nz)}</td>
                      <td className="p-2 font-bold">
                        {item.scrubbed.is_nz ? '🇳🇿 Yes' : 'No'}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
