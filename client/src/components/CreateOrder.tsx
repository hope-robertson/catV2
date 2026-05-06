import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CreateOrder() {
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    distributor: '',
    budget_limit: 1000,
    wealth_at_creation: 'ok',
  })

  const handleInitialise = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = await getAccessTokenSilently()
      const res = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(formData)

      const newId = res.body.id

      // 🚀 THE LAUNCH: Take us straight to the new order's URL
      navigate(`/orders/${newId}/catalogue`)
    } catch (err) {
      console.error('🔥 Failed to start session:', err)
      alert('Failed to initialise order. Check engine logs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-[40px] shadow-2xl border border-gray-100">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
          New Procurement Session
        </h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
          Establish parameters for the next manifest
        </p>
      </div>

      <form onSubmit={handleInitialise} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
            Target Distributor
          </label>
          <select
            required
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all"
            value={formData.distributor}
            onChange={(e) =>
              setFormData({ ...formData, distributor: e.target.value })
            }
          >
            <option value="">Select Distributor...</option>
            <option value="Southbound">Southbound</option>
            <option value="Flying Nun">Flying Nun</option>
            <option value="Warner">Warner</option>
            <option value="Universal">Universal</option>
            <option value="Border">Border</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
            Budget Allocation ($)
          </label>
          <input
            type="number"
            required
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono font-bold outline-none focus:border-blue-600 transition-all"
            value={formData.budget_limit}
            onChange={(e) =>
              setFormData({ ...formData, budget_limit: Number(e.target.value) })
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Initialising...' : 'Begin Session'}
        </button>
      </form>
    </div>
  )
}
