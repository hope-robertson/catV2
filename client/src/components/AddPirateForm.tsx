import React from 'react'

interface AddPirateFormProps {
  onSubmit: (e: React.FormEvent) => void
  formData: { name: string; email: string; auth_id: string }
  setFormData: (data: any) => void
}

export default function AddPirateForm({
  onSubmit,
  formData,
  setFormData,
}: AddPirateFormProps) {
  return (
    <div className="bg-purple-50 p-8 rounded-3xl border-2 border-dashed border-purple-200">
      <div className="mb-6 text-center">
        <h3 className="text-sm font-black uppercase text-purple-600 tracking-widest">
          Recruit New Pirate
        </h3>
        <p className="text-[10px] font-bold text-purple-400 uppercase mt-1">
          Add an officer to the database manually
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          type="text"
          placeholder="Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="p-3 rounded-xl border border-purple-100 text-xs font-bold outline-none focus:border-purple-400 bg-white"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="p-3 rounded-xl border border-purple-100 text-xs font-bold outline-none focus:border-purple-400 bg-white"
        />
        <input
          type="text"
          placeholder="Auth0 ID"
          required
          value={formData.auth_id}
          onChange={(e) =>
            setFormData({ ...formData, auth_id: e.target.value })
          }
          className="p-3 rounded-xl border border-purple-100 text-xs font-bold outline-none focus:border-purple-400 bg-white"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-purple-700 transition-all active:scale-95"
        >
          Add to Crew
        </button>
      </form>
    </div>
  )
}
