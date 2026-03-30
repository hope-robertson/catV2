import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import request from 'superagent'
import { useAuth0 } from '@auth0/auth0-react'
import { formatCurrency } from '../utils/pricing.js'

export default function OrderReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  // MANUAL INTEL: Genres that are currently low in stock
  const [lowGenres, setLowGenres] = useState<string[]>([])
  const [newGenre, setNewGenre] = useState('')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['orderSummary', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}/summary`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  const addGenre = () => {
    if (newGenre && !lowGenres.includes(newGenre)) {
      setLowGenres([...lowGenres, newGenre])
      setNewGenre('')
    }
  }

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase">
        Syncing Manifest...
      </div>
    )

  const { items, stats } = summary
  const budgetLimit = Number(localStorage.getItem('activeOrderBudget')) || 1000
  const isOverBudget = stats.totalCost > budgetLimit

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-8 pb-20">
      {/* FINANCIAL HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-green-500">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Total Spend
          </p>
          <p
            className={`text-3xl font-black ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}
          >
            {formatCurrency(stats.totalCost)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-500">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Budget Remaining
          </p>
          <p className="text-3xl font-black text-gray-900">
            {formatCurrency(budgetLimit - stats.totalCost)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-orange-500">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Banger Ratio
          </p>
          <p className="text-3xl font-black text-orange-500">
            {stats.bangerRatio.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: The Order List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">
                    Picks
                  </th>
                  <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: any) => (
                  <tr
                    key={item.item_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-black text-gray-900">{item.artist}</p>
                      <p className="text-xs text-gray-500 font-bold">
                        {item.title} (x{item.quantity})
                      </p>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(item.ams_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Tactical Intel & Staff */}
        <div className="space-y-6">
          {/* GENRE REPLENISHMENT */}
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl text-white text-xs">
            <h3 className="font-black uppercase tracking-widest mb-4">
              Replenishment Protocol
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                placeholder="Add low genre..."
                className="flex-1 bg-blue-700 border-none rounded-lg p-2 text-white placeholder-blue-300 outline-none"
              />
              <button
                onClick={addGenre}
                className="bg-white text-blue-600 px-3 rounded-lg font-black"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowGenres.map((g) => (
                <span
                  key={g}
                  className="bg-blue-500 px-2 py-1 rounded-md font-bold uppercase tracking-tighter"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* SUGGESTED STAFF */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
              Suggested Crew
            </h3>
            <div className="space-y-4">
              {/* This is where we will map over staff whose expertise matches lowGenres */}
              <div className="flex items-center justify-between group">
                <div>
                  <p className="font-black text-gray-900">Hope Robertson</p>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">
                    Expertise: Post-Punk, Techno
                  </p>
                </div>
                <button className="bg-gray-100 group-hover:bg-blue-600 group-hover:text-white text-gray-400 p-2 rounded-lg transition-all">
                  <span className="text-[9px] font-black uppercase">
                    Invite
                  </span>
                </button>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 transition-all">
              Invite All Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
