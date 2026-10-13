// client/src/components/AdminPanel.tsx
import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from 'superagent'
import { API_BASE } from '../config.js'
import { Shield, Users, Database, Settings as SettingsIcon } from 'lucide-react'

// Classic 90s OS button style consistent with your NavBar
const WinButton = ({ children, className = '', ...props }: any) => (
  <button
    {...props}
    className={`px-3 py-1 text-black border-[2px] border-white border-r-[#404040] border-b-[#404040] bg-[#C0C0C0] active:border-[#404040] active:border-r-white active:border-b-white active:bg-[#A0A0A0] flex items-center gap-1 ${className}`}
  >
    {children}
  </button>
)

export default function AdminPanel() {
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Fetch staff list for management
  const {
    data: staffList,
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ['adminStaffList'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`${API_BASE}/api/v1/staff`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  // Toggle staff trust/admin status mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({
      id,
      is_trusted_orderer,
      is_admin,
    }: {
      id: number
      is_trusted_orderer: boolean
      is_admin: boolean
    }) => {
      const token = await getAccessTokenSilently()
      await request
        .patch(`${API_BASE}/api/v1/staff/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ is_trusted_orderer, is_admin })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaffList'] })
      setActionMessage('Staff permissions updated successfully.')
      setTimeout(() => setActionMessage(null), 3000)
    },
    onError: (err: any) => {
      setActionMessage(`Failed to update permissions: ${err.message}`)
    },
  })

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* OS Window Header */}
      <div className="bg-[#C0C0C0] border-[2px] border-white border-r-[#404040] border-b-[#404040] p-1 shadow-lg">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center mb-4">
          <span className="font-bold text-xs tracking-widest flex items-center gap-2">
            <Shield size={14} /> R.O.S.S. SYSTEM ADMINISTRATION PANEL
          </span>
        </div>

        {actionMessage && (
          <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 p-3 text-xs font-bold">
            {actionMessage}
          </div>
        )}

        <div className="p-4 bg-white border border-gray-300 shadow-inner">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} /> Staff Permission Control
          </h3>

          {staffLoading ? (
            <p className="text-xs font-mono text-gray-500 animate-pulse">
              Loading staff roster...
            </p>
          ) : staffError ? (
            <p className="text-xs font-bold text-red-600">
              Error loading staff list. Ensure backend staff routes are active.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs font-mono">
                <thead>
                  <tr className="bg-gray-100 text-left font-bold text-gray-600 uppercase">
                    <th className="px-4 py-2">Name / Email</th>
                    <th className="px-4 py-2 text-center">Admin Status</th>
                    <th className="px-4 py-2 text-center">Trusted Orderer</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffList?.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">
                          {staff.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {staff.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold uppercase ${staff.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {staff.is_admin ? 'Admin' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold uppercase ${staff.is_trusted_orderer ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {staff.is_trusted_orderer ? 'Trusted' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <WinButton
                          onClick={() =>
                            updateStaffMutation.mutate({
                              id: staff.id,
                              is_admin: !staff.is_admin,
                              is_trusted_orderer: staff.is_trusted_orderer,
                            })
                          }
                          className="text-[10px] mx-auto"
                        >
                          Toggle Admin
                        </WinButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
