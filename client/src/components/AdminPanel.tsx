import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

// 📦 Components & Models
import { Staff } from '../models/staff.js'
import CrewManifesto from './CrewManifesto.js'
import AddPirateForm from './AddPirateForm.js'
import FinancialSettingsModal from './FinancialSettingsModal.js'

export default function AdminPanel() {
  const { getAccessTokenSilently } = useAuth0()

  // --- STATE ---
  const [wealthLevel, setWealthLevel] = useState<string>('ok')
  const [expenses, setExpenses] = useState({
    rent: '0',
    power: '0',
    internet: '0',
  })
  const [staff, setStaff] = useState<Staff[]>([])

  // Recruitment state (Name/Email only now)
  const [newPirate, setNewPirate] = useState({ name: '', email: '' })
  const [isUpdating, setIsUpdating] = useState(false)

  // Modal Control
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // --- DATA ACTIONS ---
  const fetchData = async () => {
    try {
      const token = await getAccessTokenSilently()
      const [settingsRes, staffRes] = await Promise.all([
        request
          .get('/api/v1/admin/settings')
          .set('Authorization', `Bearer ${token}`),
        request
          .get('/api/v1/admin/staff')
          .set('Authorization', `Bearer ${token}`),
      ])

      const settings = settingsRes.body.settings || []
      const wealth =
        settings.find((s: any) => s.key === 'wealth_level')?.value || 'ok'
      const rent =
        settings.find((s: any) => s.key === 'rent_weekly')?.value || '0'
      const power =
        settings.find((s: any) => s.key === 'power_monthly')?.value || '0'
      const internet =
        settings.find((s: any) => s.key === 'internet_monthly')?.value || '0'

      setWealthLevel(wealth)
      setExpenses({ rent, power, internet })
      setStaff(staffRes.body)
    } catch (err) {
      console.error('Data retrieval failure:', err)
    }
  }

  const handleUpdateWealth = async (level: string) => {
    setIsUpdating(true)
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch('/api/v1/admin/settings/wealth')
        .set('Authorization', `Bearer ${token}`)
        .send({ level })
      setWealthLevel(level)
    } catch (err) {
      alert('Wealth update failed.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateExpense = async (key: string, value: string) => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch('/api/v1/admin/settings/expense')
        .set('Authorization', `Bearer ${token}`)
        .send({ key, value })

      const stateKey = key.split('_')[0] as keyof typeof expenses
      setExpenses((prev) => ({ ...prev, [stateKey]: value }))
    } catch (err) {
      console.error('Expense update failed.')
    }
  }

  const handleUpdateStaff = async (id: number, fields: Partial<Staff>) => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/admin/staff/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(fields)
      fetchData()
    } catch (err) {
      alert('Failed to update crew records.')
    }
  }

  const handleAddPirate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = await getAccessTokenSilently()
      await request
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${token}`)
        .send(newPirate)
      setNewPirate({ name: '', email: '' })
      fetchData()
      setIsRecruitModalOpen(false)
    } catch (err) {
      alert('Recruitment failed.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 relative px-4">
      {/* 🚀 TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-6 mt-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Admin Command
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            USS R.O.S.S. Operations • 11/04/2026
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* WEALTH BADGE */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="group flex flex-col items-end transition-all hover:scale-105"
          >
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest group-hover:text-purple-600 transition-colors">
              Shop Wealth
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-purple-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase shadow-lg shadow-purple-100">
                {wealthLevel}
              </span>
            </div>
          </button>

          {/* RECRUIT BUTTON */}
          <button
            onClick={() => setIsRecruitModalOpen(true)}
            className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Recruit
          </button>
        </div>
      </div>

      <CrewManifesto staff={staff} onUpdate={handleUpdateStaff} />

      {/* 🛠️ MODALS */}

      {isRecruitModalOpen && (
        <AddPirateForm
          onClose={() => setIsRecruitModalOpen(false)}
          onSubmit={handleAddPirate}
          formData={newPirate}
          setFormData={setNewPirate}
        />
      )}

      {isSettingsModalOpen && (
        <FinancialSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          currentWealth={wealthLevel}
          onUpdateWealth={handleUpdateWealth}
          expenses={expenses}
          onUpdateExpenses={handleUpdateExpense}
        />
      )}

      <div className="pt-6 text-center border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
          Command Center: Designate admins and trained orderers. As of 2026,
          major changes require a majority vote.
        </p>
      </div>
    </div>
  )
}
