import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function CreateOrder() {
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  const [form, setForm] = useState({
    name: '',
    budget_limit: 1000,
    distributor: 'Southbound',
  })

  const distributors = [
    'Southbound',
    'Universal Music',
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
      const res = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(form)

      navigate(`/orders/${res.body.id}/catalogue`)
    } catch (err) {
      console.error('Order creation failed:', err)
      alert('Failed to initialize mission.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-[32px] shadow-xl border border-gray-100">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
          New Supply Mission
        </h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
          Initialize Order Parameters
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
            Reference Name
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Monthly Restock"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
              Distributor
            </label>
            <select
              value={form.distributor}
              onChange={(e) =>
                setForm({ ...form, distributor: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all appearance-none"
            >
              {distributors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
              Budget ($)
            </label>
            <input
              type="number"
              value={form.budget_limit}
              onChange={(e) =>
                setForm({ ...form, budget_limit: Number(e.target.value) })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-600 transition-all active:scale-[0.98] mt-4"
        >
          Initialize Order →
        </button>
      </form>
    </div>
  )
}
