import React, { useState, useEffect } from 'react'
import { getCollisions, resolveCollision } from '../apis/catalogue.js'
import { useAuth0 } from '@auth0/auth0-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CollisionReviewModal({ isOpen, onClose }: Props) {
  const { getAccessTokenSilently } = useAuth0()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0) // 👈 Track focus for keyboard nav

  useEffect(() => {
    if (isOpen) loadCollisions()
  }, [isOpen])

  // ⌨️ Keyboard Navigation Logic
  useEffect(() => {
    if (!isOpen || items.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          // Shift + Tab: Go Back
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
        } else {
          // Tab: Go Forward
          setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const activeItem = items[focusedIndex]
        if (activeItem) {
          handleAction(activeItem.id, 'dismiss')
          // Focus moves to next item automatically as current one is removed
        }
      }

      // Bonus: Space to "Promote/Keep"
      if (e.key === ' ') {
        e.preventDefault()
        const activeItem = items[focusedIndex]
        if (activeItem) handleAction(activeItem.id, 'promote')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, items, focusedIndex])

  const loadCollisions = async () => {
    setLoading(true)
    const token = await getAccessTokenSilently()
    const data = await getCollisions(token)
    setItems(data)
    setFocusedIndex(0)
    setLoading(false)
  }

  const handleAction = async (id: number, action: 'promote' | 'dismiss') => {
    const token = await getAccessTokenSilently()
    await resolveCollision(id, action, token)
    setItems((prev) => prev.filter((item) => item.id !== id))

    // Adjust focus if we deleted the last item
    if (focusedIndex >= items.length - 1 && focusedIndex > 0) {
      setFocusedIndex(focusedIndex - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-black text-gray-800">
              Collision Audit
            </h2>
            <p className="text-sm text-gray-500">
              <kbd className="bg-gray-200 px-1 rounded text-[10px]">TAB</kbd> to
              navigate,
              <kbd className="bg-red-100 text-red-600 px-1 rounded text-[10px] ml-1">
                ENTER
              </kbd>{' '}
              to discard,
              <kbd className="bg-green-100 text-green-600 px-1 rounded text-[10px] ml-1">
                SPACE
              </kbd>{' '}
              to keep.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${idx === focusedIndex ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset shadow-inner' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      {item.artist || 'VARIOUS'}
                    </div>
                    <div className="text-xs text-gray-500">{item.title}</div>
                    <div className="text-[10px] text-blue-600 font-mono mt-1">
                      {item.catalogue_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {item.collision_reason}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase">
                      {item.source_table}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(item.id, 'promote')}
                        className="text-[10px] font-bold bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Keep (Space)
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'dismiss')}
                        className="text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1 rounded border border-red-100 hover:bg-red-100"
                      >
                        Discard (Enter)
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
