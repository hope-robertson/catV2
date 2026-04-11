import React from 'react'

interface AddPirateFormProps {
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  formData: { name: string; email: string }
  setFormData: (data: { name: string; email: string }) => void
}

export default function AddPirateForm({
  onClose,
  onSubmit,
  formData,
  setFormData,
}: AddPirateFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-purple-100 animate-in fade-in zoom-in duration-200">
        {/* MODAL HEADER */}
        <div className="bg-purple-600 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">
              Recruit Pirate
            </h3>
            <p className="text-[10px] font-bold text-purple-200 uppercase mt-1">
              Assigning Initial Clearance
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-black text-white hover:rotate-90 transition-transform"
          >
            ×
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all"
              placeholder="e.g. Seth"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Work Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all"
              placeholder="pirate@ridesuper.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-purple-600 transition-all uppercase tracking-widest text-sm mt-4"
          >
            Add to Manifest
          </button>
        </form>
      </div>
    </div>
  )
}
