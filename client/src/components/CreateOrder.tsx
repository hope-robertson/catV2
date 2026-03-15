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

  // Your specific distributor list
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
          wealth_at_creation: 'ok', // Defaulting until Admin setting is built
        })

      if (response.status === 201) {
        localStorage.setItem('activeOrderId', response.body.orderId)
        localStorage.setItem('activeOrderBudget', budget.toString())
        localStorage.setItem('activeOrderDistributor', distributor)

        alert(`Order for ${distributor} initialized.`)
        navigate('/catalogue')
      }
    } catch (err) {
      console.error(err)
      alert('Error initializing order.')
    }
  }

  if (!isTrusted) return null

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
        <span className="text-green-500">📝</span> Start Order Session
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-bold mb-2 uppercase text-gray-400 text-[10px] tracking-widest">
            Primary Distributor
          </label>
          <select
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all"
            required
          >
            <option value="">Select source...</option>
            {distributors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-4 uppercase text-gray-400 text-[10px] tracking-widest">
            Session Budget:{' '}
            <span className="text-green-600 text-lg ml-2">
              {formatCurrency(budget)}
            </span>
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-lg appearance-none accent-green-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-black text-gray-300 mt-2 uppercase tracking-widest">
            <span>$100</span>
            <span>$10,000</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
          Initialize Mission
        </button>
      </form>
    </div>
  )
}
