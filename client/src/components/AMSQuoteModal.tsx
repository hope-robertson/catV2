import React, { useState, useEffect } from 'react'

interface AMSQuoteModalProps {
  item: any
  exchangeRate: number
  onClose: () => void
  onSaveQuote: (quotedItem: any) => void
}

export default function AMSQuoteModal({
  item,
  exchangeRate,
  onClose,
  onSaveQuote,
}: AMSQuoteModalProps) {
  // Defaults based on your spreadsheet
  const [usdPrice, setUsdPrice] = useState(item.ams_wholesale_usd || 11.0)
  const [freight, setFreight] = useState(13.0)
  const [markup, setMarkup] = useState(1.5)

  // Live Math
  const costPrice = usdPrice / exchangeRate + freight
  const retailPrice = Math.ceil(costPrice * markup)
  const profit = retailPrice - costPrice

  const handleSave = () => {
    onSaveQuote({
      ...item,
      quantity: 1,
      quoted_price: retailPrice,
      base_usd_price: usdPrice,
      exchange_rate_used: exchangeRate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-blue-100 animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">
              Import Quote
            </h3>
            <p className="text-[10px] font-bold text-blue-200 uppercase mt-1 truncate max-w-[250px]">
              {item.artist} - {item.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-black text-white hover:rotate-90 transition-transform"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* INPUTS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black uppercase text-gray-500">
                AMS USD Price
              </span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={usdPrice}
                  onChange={(e) => setUsdPrice(Number(e.target.value))}
                  className="w-20 bg-transparent font-black text-right outline-none text-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">
                  Freight (NZD)
                </span>
                <input
                  type="number"
                  step="1"
                  value={freight}
                  onChange={(e) => setFreight(Number(e.target.value))}
                  className="w-full bg-transparent font-black outline-none text-gray-900"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">
                  Markup (x)
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                  className="w-full bg-transparent font-black outline-none text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* READOUT HUD */}
          <div className="bg-gray-900 p-6 rounded-2xl text-white space-y-3 shadow-inner">
            <div className="flex justify-between items-end border-b border-white/10 pb-3">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Rate Used
              </span>
              <span className="font-mono text-sm text-blue-400">
                {exchangeRate}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Est. Cost (Landed)
              </span>
              <span className="font-mono font-bold">
                ${costPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Profit Margin
              </span>
              <span className="font-mono font-bold text-green-400">
                ${profit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-white/10">
              <span className="text-[12px] font-black uppercase text-white">
                Quoted Retail
              </span>
              <span className="text-2xl font-black text-white">
                ${retailPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-500 transition-all uppercase tracking-widest text-sm active:scale-95"
          >
            Lock Quote & Add
          </button>
        </div>
      </div>
    </div>
  )
}
