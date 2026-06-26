import React from 'react'

interface DocketItem {
  artist: string
  title: string
  quoted_price: number
  [key: string]: any
}

interface FloatingCustomerDocketProps {
  isOpen: boolean
  isMinimized: boolean
  onToggleMinimize: () => void
  onClose: () => void
  docketItems: DocketItem[]
  onRemoveItem: (index: number) => void
  customerForm: {
    name: string
    phone: string
    email: string
    notes: string
  }
  setCustomerForm: (form: any) => void
  onFinalize: () => void
  isPending: boolean
}

export default function FloatingCustomerDocket({
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  docketItems,
  onRemoveItem,
  customerForm,
  setCustomerForm,
  onFinalize,
  isPending,
}: FloatingCustomerDocketProps) {
  if (!isOpen) return null

  const docketTotal = docketItems.reduce(
    (sum, item) => sum + (item.quoted_price || 0),
    0,
  )

  const isFormValid =
    customerForm.name.length > 1 &&
    customerForm.phone.length > 5 &&
    docketItems.length > 0

  return (
    <div
      className={`fixed z-[100] right-6 transition-all duration-300 shadow-2xl flex flex-col border-[2px] border-white border-r-[#404040] border-b-[#404040] bg-[#C0C0C0] ${
        isMinimized
          ? 'bottom-0 w-[280px] h-8'
          : 'bottom-6 w-[340px] max-h-[85vh]'
      }`}
    >
      {/* WINDOW HEADER */}
      <div
        className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center cursor-pointer select-none active:bg-blue-800"
        onClick={onToggleMinimize}
      >
        <span className="font-bold text-[10px] tracking-widest truncate pr-2">
          📝 Cust. Docket ({docketItems.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleMinimize()
            }}
            className="w-4 h-4 bg-[#C0C0C0] text-black text-[8px] font-black border-[1px] border-white border-r-[#404040] border-b-[#404040] flex items-center justify-center active:border-[#404040] active:border-r-white active:border-b-white"
          >
            _
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm('Close and discard this customer docket?')) {
                onClose()
              }
            }}
            className="w-4 h-4 bg-[#C0C0C0] text-black text-[8px] font-black border-[1px] border-white border-r-[#404040] border-b-[#404040] flex items-center justify-center active:border-[#404040] active:border-r-white active:border-b-white"
          >
            X
          </button>
        </div>
      </div>

      {/* WINDOW CONTENT */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {/* Customer Details Form */}
          <div className="bg-white p-2 border-[2px] border-[#404040] border-r-white border-b-white space-y-1.5">
            <input
              placeholder="Customer Name *"
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
              className="w-full text-xs font-bold p-1.5 border border-gray-300 outline-none focus:border-blue-500"
            />
            <input
              placeholder="Phone Number *"
              value={customerForm.phone}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, phone: e.target.value })
              }
              className="w-full text-xs font-bold p-1.5 border border-gray-300 outline-none focus:border-blue-500"
            />
            <input
              placeholder="Email (Optional)"
              value={customerForm.email}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, email: e.target.value })
              }
              className="w-full text-xs font-bold p-1.5 border border-gray-300 outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Notes..."
              value={customerForm.notes}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, notes: e.target.value })
              }
              className="w-full text-xs font-bold p-1.5 border border-gray-300 resize-none h-14 outline-none focus:border-blue-500"
            />
          </div>

          {/* Docket Items List */}
          <div className="bg-white p-2 border-[2px] border-[#404040] border-r-white border-b-white flex-1 overflow-y-auto max-h-[30vh]">
            {docketItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-gray-100 py-2 mb-1 last:border-0"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-black text-gray-900 truncate">
                    {item.artist}
                  </p>
                  <p className="text-[9px] font-bold text-gray-500 truncate">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-blue-600">
                    ${item.quoted_price}
                  </span>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="text-red-500 hover:bg-red-50 px-1 rounded text-xs font-black"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
            {docketItems.length === 0 && (
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center py-4">
                No items added to docket.
              </p>
            )}
          </div>

          {/* Total & Submit */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase text-gray-600">
              Total:
            </span>
            <span className="text-sm font-black text-gray-900">
              ${docketTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onFinalize}
            disabled={!isFormValid || isPending}
            className="bg-[#C0C0C0] border-[2px] border-white border-r-[#404040] border-b-[#404040] active:border-[#404040] active:border-r-white active:border-b-white py-2 px-4 font-black text-[10px] uppercase w-full disabled:opacity-50 disabled:active:border-white disabled:active:border-r-[#404040] disabled:active:border-b-[#404040]"
          >
            {isPending ? 'Saving...' : 'Lock Customer Docket'}
          </button>
        </div>
      )}
    </div>
  )
}
