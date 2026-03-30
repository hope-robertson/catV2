import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'

// 📦 Import your new components
import { Staff } from '../models/staff.js'
import WealthControl from './WealthControl.js'
import CrewManifesto from './CrewManifesto.js'
import AddPirateForm from './AddPirateForm.js'

export default function AdminPanel() {
  const { getAccessTokenSilently } = useAuth0()
  const [wealthLevel, setWealthLevel] = useState<string>('ok')
  const [staff, setStaff] = useState<Staff[]>([])
  const [newPirate, setNewPirate] = useState({
    name: '',
    email: '',
    auth_id: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)

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
      setWealthLevel(settingsRes.body.wealth_level)
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
      setNewPirate({ name: '', email: '', auth_id: '' })
      fetchData()
    } catch (err) {
      alert('Recruitment failed.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* 💰 PASS PROPS: level, onUpdate, and disabled status */}
      <WealthControl
        level={wealthLevel}
        onUpdate={handleUpdateWealth}
        disabled={isUpdating}
      />

      {/* 👥 PASS PROPS: the staff array and the update function */}
      <CrewManifesto staff={staff} onUpdate={handleUpdateStaff} />

      {/* ➕ PASS PROPS: the form data and submit function */}
      <AddPirateForm
        onSubmit={handleAddPirate}
        formData={newPirate}
        setFormData={setNewPirate}
      />

      <div className="pt-6 text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest max-w-2xl mx-auto">
          Command Center: Designate admins and trained orderers. As of
          30/03/2026, major changes require a majority vote.
        </p>
      </div>
    </div>
  )
}
