import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useStaff } from '../hooks/useStaff.js'
import { formatCurrency } from '../utils/pricing.js'

export default function CreateOrder() {
  const { getAccessTokenSilently } = useAuth0()
  const { isTrusted } = useStaff()

  const [distributor, setDistributor] = useState('')
  const [budget, setBudget] = useState<number>(500)
  const [wealth, setWealth] = useState('ok')

  const distributors = [
    'Southbound',
    'Flying Nun',
    'Universal',
    'Warner',
    'Rough Trade',
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
          wealth_at_creation: wealth,
        })

      if (response.status === 201) {
        alert(`Order ${response.body.orderId} initialized.`)
      }
    } catch (err) {
      console.error(err)
      alert('Error initializing order.')
    }
  }

  if (!isTrusted) return null

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
        <span className="text-green-500">📝</span> New Order
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2">Distributor</label>
          <select
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            className="w-full p-3 bg-gray-50 border rounded-lg"
            required
          >
            <option value="">Select...</option>
            {distributors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Wealth Level</label>
          <div className="grid grid-cols-3 gap-3">
            {['poor', 'ok', 'wealthy'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setWealth(level)}
                className={`p-3 rounded-lg border-2 font-bold capitalize ${
                  wealth === level
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Budget: {formatCurrency(budget)}
          </label>
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg accent-green-600"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white font-black py-4 rounded-xl"
        >
          INITIALIZE ORDER
        </button>
      </form>
    </div>
  )
}
