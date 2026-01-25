import React, { useState } from 'react'

export default function ImportData() {
  const [uploading, setUploading] = useState(false)

  const handleConsolidate = async () => {
    if (
      !confirm(
        'This will merge all imported data into the Master Catalogue. Proceed?',
      )
    )
      return

    try {
      const response = await fetch('/api/v1/catalogue/consolidate', {
        method: 'POST',
      })
      const result = await response.json()
      alert(`Success! ${result.count} records consolidated.`)
    } catch (err) {
      alert('Consolidation failed. Check server logs.')
    }
  }

  return (
    <div className="space-y-8 py-6">
      <section className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4">1. Upload Files</h2>
        <input
          type="file"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">2. Process & Clean</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Once files are uploaded, click below to clean the data and move it to
          the Master Catalogue.
        </p>
        <button
          onClick={handleConsolidate}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform active:scale-95"
        >
          Consolidate to Master Table
        </button>
      </section>
    </div>
  )
}
