import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import request from 'superagent'
import { useStaff } from '../hooks/useStaff.js'
import { formatCurrency } from '../utils/pricing.js'

export default function CreateOrder() {
  const { getAccessTokenSilently } = useAuth0()
  const { isTrusted } = useStaff()
  const navigate = useNavigate()

  const [distributor, setDistributor] = useState('')
  const [budget, setBudget] = useState<number>(500)

  // Check if there is an existing order in progress
  const activeOrderId = localStorage.getItem('activeOrderId')
  const activeDistributor = localStorage.getItem('activeOrderDistributor')

  const distributors = [
    'Southbound',
    'Flying Nun Records Limited',
    'Border Music',
    'Collective (LP)',
    'Collective (CD)',
    'Rhythmethod',
    'Sony Music',
    'Warner Music',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = await getAccessTokenSilently()
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          distributor,
          budget_limit: budget,
          wealth_at_creation: 'ok',
        })

      if (response.status === 201) {
        localStorage.setItem('activeOrderId', response.body.orderId)
        localStorage.setItem('activeOrderBudget', budget.toString())
        localStorage.setItem('activeOrderDistributor', distributor)

        navigate('/catalogue')
      }
    } catch (err) {
      console.error(err)
      alert('Initialization failed. Check engine logs.')
    }
  }

  // 💣 THE NUKE LOGIC
  const handleNuke = async () => {
    if (
      !window.confirm(
        '⚠️ ABORT MISSION? This will permanently delete the current order draft and all selected items.',
      )
    )
      return

    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${activeOrderId}`)
        .set('Authorization', `Bearer ${token}`)

      localStorage.removeItem('activeOrderId')
      localStorage.removeItem('activeOrderBudget')
      localStorage.removeItem('activeOrderDistributor')

      // Refresh to reset the view
      navigate(0)
    } catch (err) {
      alert('Nuke command failed. The order survives.')
    }
  }

  if (!isTrusted) return null

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      {/* ⚠️ ACTIVE ORDER WARNING & NUKE BUTTON */}
      {activeOrderId && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex flex-col gap-4">
          <div>
            <h3 className="text-red-600 font-black uppercase text-xs tracking-widest">
              Active Session Detected
            </h3>
            <p className="text-gray-600 text-xs font-bold mt-1">
              You are currently ordering from{' '}
              <span className="text-red-600 underline">
                {activeDistributor}
              </span>
              . You must finalize or nuke this session before starting a new
              one.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/catalogue')}
              className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all"
            >
              Return to Picks
            </button>
            <button
              onClick={handleNuke}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
            >
              💣 Nuke Session
            </button>
          </div>
        </div>
      )}

      {/* INITIALIZE FORM - Only enabled if no active order */}
      <div
        className={`bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 transition-opacity ${activeOrderId ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Initialize Order
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
            Buying Session Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">
              Source Distributor
            </label>
            <select
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-all"
              required
            >
              <option value="">Select a supplier...</option>
              {distributors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col bg-gray-50 p-8 rounded-2xl border border-gray-100 gap-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Spending Limit
              </label>
              <span className="text-3xl font-black text-green-600 tabular-nums">
                {formatCurrency(budget)}
              </span>
            </div>

            <div className="flex w-full">
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-green-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            Engage Session
          </button>
        </form>
      </div>
    </div>
  )
}
