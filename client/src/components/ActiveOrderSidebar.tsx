import React, { useState } from 'react'
import { formatCurrency } from '../utils/pricing.js'
import { ActiveOrderSidebarProps } from '../models/orders.js'

export default function ActiveOrderSidebar({
  dbTotal,
  dbCount,
  budgetLimit,
  orderItems,
  isTrusted,
  onFinalize,
  onAbort,
  onRemoveItem,
}: ActiveOrderSidebarProps) {
  const [confirmFinalize, setConfirmFinalize] = useState(false)
  const [confirmAbort, setConfirmAbort] = useState(false)

  const handleFinalizeClick = () => {
    if (confirmFinalize) {
      onFinalize()
      setConfirmFinalize(false)
    } else {
      setConfirmFinalize(true)
      setConfirmAbort(false)
    }
  }

  const handleAbortClick = () => {
    if (confirmAbort) {
      onAbort()
      setConfirmAbort(false)
    } else {
      setConfirmAbort(true)
      setConfirmFinalize(false)
    }
  }

  return (
    <div className="fixed top-24 right-6 w-72 z-40 h-[calc(100vh-120px)] flex flex-col gap-4">
      <div className="bg-gray-900 shadow-2xl rounded-[32px] p-6 text-white border-2 border-white/10 shrink-0">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
              Live Spend
            </p>
            <p className="text-2xl font-black">{formatCurrency(dbTotal)}</p>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-700"
              style={{
                width: `${Math.min((dbTotal / budgetLimit) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Limit: ${budgetLimit}
              </p>
              <p
                className={`text-sm font-bold ${budgetLimit - dbTotal < 0 ? 'text-red-400' : 'text-green-400'}`}
              >
                {formatCurrency(budgetLimit - dbTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Total Qty
              </p>
              <p className="text-sm font-bold">{dbCount}</p>
            </div>
          </div>

          {isTrusted && (
            <div className="flex gap-2 pt-2">
              {confirmFinalize ? (
                <button
                  onClick={handleFinalizeClick}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase py-3 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  Yes, Lock It
                </button>
              ) : confirmAbort ? (
                <button
                  onClick={handleAbortClick}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase py-3 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  Yes, Delete
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmFinalize(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase py-3 rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Finalize
                  </button>
                  <button
                    onClick={() => setConfirmAbort(true)}
                    className="flex-none bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-black text-[10px] uppercase px-4 py-3 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                    title="Abort Mission"
                  >
                    <svg
                      style={{ width: '14px', height: '14px' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Abort
                  </button>
                </>
              )}

              {(confirmFinalize || confirmAbort) && (
                <button
                  onClick={() => {
                    setConfirmFinalize(false)
                    setConfirmAbort(false)
                  }}
                  className="flex-none bg-gray-200 text-gray-700 hover:bg-gray-300 font-black text-[10px] uppercase px-4 py-3 rounded-2xl transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Current Manifest
          </h3>
          <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full">
            {orderItems.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {orderItems.length === 0 ? (
            <p className="text-center text-[10px] text-gray-300 font-bold mt-10 px-4">
              No items added to this mission yet.
            </p>
          ) : (
            orderItems.map((item) => (
              <div
                key={item.item_id}
                className="p-3 bg-gray-50 rounded-2xl flex justify-between items-start group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[10px] font-black text-gray-900 truncate">
                    {item.artist}
                  </p>
                  <p className="text-[9px] text-gray-500 font-bold truncate leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-blue-500 font-black mt-1">
                    x{item.quantity} • ${item.ams_price}
                  </p>
                </div>
                {isTrusted && (
                  <button
                    onClick={() => onRemoveItem(item.item_id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      style={{ width: '16px', height: '16px' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
