import React, { useState } from 'react'

interface FinancialSettingsProps {
  onClose: () => void
  currentWealth: string
  onUpdateWealth: (level: string) => void
  expenses: { rent: string; power: string; internet: string }
  onUpdateExpenses: (key: string, value: string) => void
}

export default function FinancialSettingsModal({
  onClose,
  currentWealth,
  onUpdateWealth,
  expenses,
  onUpdateExpenses,
}: FinancialSettingsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-purple-100 animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="bg-purple-600 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">
              Financial Override
            </h3>
            <p className="text-[10px] font-bold text-purple-200 uppercase mt-1">
              Adjusting Shop Economics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-black text-white hover:rotate-90 transition-transform"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* WEALTH TOGGLE */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Current Wealth Climate
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['poor', 'ok', 'wealthy'].map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdateWealth(level)}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${
                    currentWealth === level
                      ? 'bg-purple-600 border-purple-700 text-white shadow-lg'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* MANUAL BILL ENTRY */}
          <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-100">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">
              Operating Expenses
            </h4>

            {[
              {
                label: 'Weekly Rent',
                key: 'rent_weekly',
                value: expenses.rent,
              },
              {
                label: 'Monthly Power',
                key: 'power_monthly',
                value: expenses.power,
              },
              {
                label: 'Monthly Internet',
                key: 'internet_monthly',
                value: expenses.internet,
              },
            ].map((bill) => (
              <div
                key={bill.key}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl"
              >
                <span className="text-[10px] font-black uppercase text-gray-500">
                  {bill.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    value={bill.value}
                    onChange={(e) => onUpdateExpenses(bill.key, e.target.value)}
                    className="w-24 bg-transparent font-black text-right outline-none text-purple-600"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-purple-600 transition-all uppercase tracking-widest text-sm mt-4"
          >
            Update Ledger
          </button>
        </div>
      </div>
    </div>
  )
}
