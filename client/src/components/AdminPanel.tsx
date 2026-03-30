import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

export default function AdminPanel() {
  const { getAccessTokenSilently } = useAuth0()
  const [wealthLevel, setWealthLevel] = useState<string>('ok')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchSettings = async () => {
    try {
      const token = await getAccessTokenSilently()
      const res = await request
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${token}`)

      setWealthLevel(res.body.wealth_level)
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  const updateWealth = async (level: string) => {
    setIsUpdating(true)
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch('/api/v1/admin/settings/wealth')
        .set('Authorization', `Bearer ${token}`)
        .send({ level })

      setWealthLevel(level)
    } catch (err) {
      console.error('Failed to update wealth:', err)
      alert('Command failed: Could not update wealth level.')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-purple-100">
        <h2 className="text-2xl font-black uppercase text-purple-600 mb-6 tracking-tighter">
          ⚙️ Command Center
        </h2>

        <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-1">
                Global Shop Wealth
              </h3>
              <p className="text-sm text-gray-500">
                Adjusting this shifts the economic climate for all future
                orders.
              </p>
            </div>
            <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase animate-pulse">
              Live State: {wealthLevel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['poor', 'ok', 'wealthy'].map((level) => (
              <button
                key={level}
                onClick={() => updateWealth(level)}
                disabled={isUpdating}
                className={`py-4 rounded-xl font-black text-xs uppercase transition-all border-2 shadow-sm ${
                  wealthLevel === level
                    ? 'bg-purple-600 border-purple-700 text-white scale-105 shadow-purple-200'
                    : 'bg-white border-purple-100 text-purple-400 hover:border-purple-300'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            Welcome to the Admin Screen. Some changes here may require a
            majority vote from the team. As of 30/03/2026, this is done via
            polls in a fb group, but we are hoping to have a functional poll
            system working here soon. Adjusting shop wealth will require a vote
            amongst admins, if not all. Auto-Suggestions on how much to spend
            will be related to this. You may designate others as admins, or as
            being trained in the ordering process.
          </p>
        </div>
      </div>
    </div>
  )
}
