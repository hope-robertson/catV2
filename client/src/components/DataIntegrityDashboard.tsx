import React, { useState } from 'react'
import CollisionReviewModal from './CollisionReviewModal.js'

interface Props {
  fileName: string | null
  stagedCount: number | null
  distributor: string | null
  isConsolidating: boolean
  collisionCount?: number // Added to track potential duplicates
}

export default function DataIntegrityDashboard({
  fileName,
  stagedCount,
  distributor,
  isConsolidating,
  collisionCount = 0,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const step1Complete = !!fileName
  const step2Complete = stagedCount !== null && stagedCount > 0

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Step 1: File Selection */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${step1Complete ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Step 1: Selection
          </p>
          <p className="font-bold text-gray-800 mt-1 truncate">
            {fileName || 'Waiting for file...'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {step1Complete
              ? 'File ready for staging'
              : 'Select a distributor and file'}
          </p>
        </div>

        {/* Step 2: Staging Status */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${step2Complete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Step 2: Staging
          </p>
          <p className="font-bold text-gray-800 mt-1">
            {step2Complete
              ? `${stagedCount} Records Staged`
              : 'Staging Area Empty'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {distributor ? `Source: ${distributor}` : 'No data processed yet'}
          </p>
        </div>

        {/* Step 3: Consolidation */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${isConsolidating ? 'border-orange-500 bg-orange-50 animate-pulse' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Step 3: Master Merge
          </p>
          <p className="font-bold text-gray-800 mt-1">
            {isConsolidating ? 'Consolidating...' : 'Ready to Merge'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {step2Complete
              ? 'Validated and ready for master'
              : 'Complete steps 1 and 2 first'}
          </p>
        </div>

        {/* Audit: Collision Review */}
        <div
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${collisionCount > 0 ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}
          onClick={() => collisionCount > 0 && setIsModalOpen(true)}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Audit: Collisions
          </p>
          <p className="font-bold text-gray-800 mt-1">
            {collisionCount} Duplicate Flags
          </p>
          <button
            disabled={collisionCount === 0}
            className={`text-xs font-bold mt-2 underline ${collisionCount > 0 ? 'text-amber-700' : 'text-gray-300'}`}
          >
            Review Extras
          </button>
        </div>
      </div>

      <CollisionReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
