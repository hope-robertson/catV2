import React from 'react'
import { Staff } from '../models/staff.js'

interface CrewManifestoProps {
  staff: Staff[]
  onUpdate: (id: number, fields: Partial<Staff>) => void
}

export default function CrewManifesto({ staff, onUpdate }: CrewManifestoProps) {
  const modules = [
    { label: 'Open', key: 'trained_open' },
    { label: 'Close', key: 'trained_close' },
    { label: 'Mail', key: 'trained_mail_orders' },
    { label: 'Books', key: 'trained_books' },
    { label: 'Comics', key: 'trained_comics' },
  ]

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase text-gray-900 tracking-widest">
            Crew Manifesto
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
            Status & Training Clearance
          </p>
        </div>
      </div>

      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-6 text-[10px] font-black uppercase text-gray-400">
              Officer
            </th>
            <th className="p-6 text-[10px] font-black uppercase text-gray-400 text-center">
              Admin
            </th>
            <th className="p-6 text-[10px] font-black uppercase text-gray-400 text-center">
              Orderer
            </th>
            <th className="p-6 text-[10px] font-black uppercase text-gray-400">
              Training Modules
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staff.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-6">
                <p className="font-black text-gray-900">{p.name}</p>
                <p className="text-[10px] font-mono text-gray-400">{p.email}</p>
              </td>
              <td className="p-6 text-center">
                <input
                  type="checkbox"
                  checked={p.is_admin}
                  onChange={(e) =>
                    onUpdate(p.id, { is_admin: e.target.checked })
                  }
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </td>
              <td className="p-6 text-center">
                <input
                  type="checkbox"
                  checked={p.is_trusted_orderer}
                  onChange={(e) =>
                    onUpdate(p.id, { is_trusted_orderer: e.target.checked })
                  }
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </td>
              <td className="p-6">
                <div className="flex flex-wrap gap-2">
                  {modules.map((m) => (
                    <button
                      key={m.key}
                      onClick={() =>
                        onUpdate(p.id, { [m.key]: !p[m.key as keyof Staff] })
                      }
                      className={`px-2 py-1 rounded text-[8px] font-black uppercase border transition-all ${
                        p[m.key as keyof Staff]
                          ? 'bg-green-100 border-green-200 text-green-700 shadow-sm'
                          : 'bg-gray-50 border-gray-100 text-gray-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
