import React, { useState } from 'react'

export default function ImportData() {
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [status, setStatus] = useState('')

  const handleConsolidate = async () => {
    const confirmed = window.confirm(
      'This will scrub all data in the staging tables and move it to the Master Catalogue. Proceed?',
    )

    if (!confirmed) return

    setIsConsolidating(true)
    setStatus('Processing and scrubbing data...')

    try {
      const response = await fetch('/api/v1/catalogue/consolidate', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setStatus(
          `Success! Moved ${data.count} records to the Master Catalogue.`,
        )
        alert(`Success! ${data.count} records consolidated.`)
      } else {
        throw new Error(data.message || 'Consolidation failed')
      }
    } catch (err) {
      console.error(err)
      setStatus('Error: Consolidation failed. Check server logs.')
      alert('Consolidation failed. Please check the console for details.')
    } finally {
      setIsConsolidating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Data Management
        </h2>
        <p className="text-gray-600 mb-8">
          Upload your distributor files first, then use the consolidate tool to
          clean and merge them into your searchable catalogue.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Upload (Placeholder for your upload component) */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              1. Upload Files
            </h3>
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-400">
                File upload logic goes here
              </p>
            </div>
          </section>

          {/* Section 2: Consolidate */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              2. Run Scrubber
            </h3>
            <p className="text-sm text-gray-500">
              This process trims whitespace, fixes barcode formatting, and
              normalizes artist names.
            </p>
            <button
              onClick={handleConsolidate}
              disabled={isConsolidating}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md ${
                isConsolidating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {isConsolidating ? 'Consolidating...' : 'Consolidate to Master'}
            </button>
            {status && (
              <p
                className={`mt-2 text-sm font-medium ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}
              >
                {status}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
