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

  const [lowGenres, setLowGenres] = useState<string[]>([])
  const [newGenre, setNewGenre] = useState('')

  // 📡 1. Fetch Order Header (For Budget & Distributor Name)
  const { data: orderHeader } = useQuery({
    queryKey: ['orderHeader', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  // 📡 2. Fetch Order Summary (Items & Totals)
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

  // 📝 THE EXPORTER: Turns the current manifest into a text file
  const downloadOrderList = () => {
    if (!summary || !orderHeader) return

    const header = `RIDE ON SUPER SOUND - PROCUREMENT MANIFEST\n`
    const distLine = `DISTRIBUTOR: ${orderHeader.distributor.toUpperCase()}\n`
    const sessionLine = `SESSION ID: #${id}\n`
    const dateLine = `GENERATED: ${new Date().toLocaleDateString()}\n`
    const sep = `--------------------------------------------------\n`

    const body = summary.items
      .map(
        (item: any) =>
          `${item.artist.toUpperCase()} - ${item.title} (x${item.quantity}) @ ${formatCurrency(item.ams_price)} ea`,
      )
      .join('\n')

    const total = `\n${sep}TOTAL PROJECTED SPEND: ${formatCurrency(summary.stats.totalCost)}\n`
    const footer = `${sep}END OF MANIFEST`

    const blob = new Blob(
      [
        header +
          distLine +
          sessionLine +
          dateLine +
          sep +
          body +
          total +
          footer,
      ],
      {
        type: 'text/plain',
      },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `order_${orderHeader.distributor}_${id}_${new Date().toISOString().split('T')[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const addGenre = () => {
    if (newGenre && !lowGenres.includes(newGenre)) {
      setLowGenres([...lowGenres, newGenre])
      setNewGenre('')
    }
  }

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-gray-400">
        Compiling Tactical Summary...
      </div>
    )

  // 🎯 THE FIX: Defining these variables so the JSX can access them
  const items = summary?.items || []
  const stats = summary?.stats || { totalCost: 0, totalItems: 0 }
  const budgetLimit = orderHeader?.budget_limit || 0
  const remaining = budgetLimit - stats.totalCost
  const isOverBudget = stats.totalCost > budgetLimit

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-8 pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end border-b-4 border-gray-900 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Final Review
          </h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">
            {orderHeader?.distributor} • Session #{id}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/orders/${id}/catalogue`)}
            className="px-6 py-3 border-2 border-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
          >
            ← Back to Picks
          </button>
          <button
            onClick={downloadOrderList}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            📄 Finalize & Export
          </button>
        </div>
      </div>

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
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-50">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Remaining Budget
          </p>
          <p
            className={`text-3xl font-black ${remaining < 0 ? 'text-red-400' : 'text-gray-900'}`}
          >
            {formatCurrency(remaining)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-orange-500">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Banger Ratio
          </p>
          <p className="text-3xl font-black text-orange-500">
            {stats.bangerRatio?.toFixed(0) || 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Artist / Title
                  </th>
                  <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Qty
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: any) => (
                  <tr
                    key={item.item_id}
                    className="hover:bg-blue-50/20 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <p className="font-black text-gray-900 uppercase text-sm leading-none">
                        {item.artist}
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-1">
                        {item.title}
                      </p>
                      <p className="text-[9px] font-black text-blue-500 uppercase mt-1">
                        Picked by: {item.staff_member || 'System'}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center font-mono font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-gray-600">
                      {formatCurrency(item.ams_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="font-black uppercase tracking-widest mb-4 text-xs text-blue-400">
              Inventory Gaps
            </h3>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                placeholder="Low genre..."
                className="flex-1 bg-gray-800 border-none rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none"
              />
              <button
                onClick={addGenre}
                className="bg-blue-600 text-white px-4 rounded-xl font-black"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowGenres.map((g) => (
                <span
                  key={g}
                  className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-widest"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">
              Crew Involvement
            </h3>
            <div className="space-y-6">
              {Array.from(new Set(items.map((i: any) => i.staff_member))).map(
                (name: any) => (
                  <div key={name} className="flex items-center justify-between">
                    <p className="font-black text-gray-900 text-xs uppercase">
                      {name || 'System'}
                    </p>
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded uppercase">
                      Active
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
