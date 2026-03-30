import React from 'react'

interface WealthControlProps {
  level: string
  onUpdate: (level: string) => void
  disabled: boolean
}

export default function WealthControl({
  level,
  onUpdate,
  disabled,
}: WealthControlProps) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-purple-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black uppercase text-purple-600 mb-1 tracking-widest">
            Global Shop Wealth
          </h2>
          <p className="text-sm text-gray-500">
            Adjusting this shifts the economic climate for all future orders.
          </p>
        </div>
        <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase animate-pulse">
          Live State: {level}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['poor', 'ok', 'wealthy'].map((l) => (
          <button
            key={l}
            onClick={() => onUpdate(l)}
            disabled={disabled}
            className={`py-4 rounded-xl font-black text-xs uppercase border-2 transition-all shadow-sm ${
              level === l
                ? 'bg-purple-600 border-purple-700 text-white scale-105 shadow-purple-200'
                : 'bg-white border-purple-50 text-purple-200 hover:border-purple-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
