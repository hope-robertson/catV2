import React, { useMemo } from 'react'
import { formatCurrency } from '../utils/pricing.js'
import { DISTRIBUTOR_CONFIGS } from '../../../server/utils/distributorConfigs.js'

interface Props {
  items: any[]
  allStaff: any[]
  budgetLimit: number
  wealthLevel: string
  distributorName: string
}

export default function OrderReview({
  items,
  allStaff,
  budgetLimit,
  wealthLevel,
  distributorName,
}: Props) {
  const AVG_LP_COST = 35

  const stats = useMemo(() => {
    const customerOrders = items.filter((i) => i.customer_id || i.is_customer_order)
    const staffPicks = items.filter((i) => !i.customer_id && !i.is_customer_order)

    const bangers = staffPicks.filter((i) => (i.rating || 0) >= 4)
    const risky = staffPicks.filter((i) => (i.rating || 0) < 4)

    /* Shop Bangers are high-rated items paid for by the shop investor */
    const shopBangers = staffPicks.filter(
      (i) => (i.rating || 0) >= 4 && i.investor_name === 'Shop'
    )

    const totalWholesale = items.reduce((sum, i) => sum + (i.price || 0), 0)
    const config = Object.values(DISTRIBUTOR_CONFIGS).find(
      (c) => c.name === distributorName
    )

    const freightPerItem = config?.defaultFreightPerItem || 0
    const freightTotal = items.length * freightPerItem
    const totalLanded = totalWholesale * 1.15 + freightTotal

    const bangerCost = shopBangers.reduce((sum, i) => sum + i.price * 1.15 + freightPerItem, 0)

    return {
      customerOrders,
      staffPicks,
      bangers,
      risky,
      totalLanded,
      remaining: budgetLimit - totalLanded,
      bangerRatio: (bangers.length / (staffPicks.length || 1)) * 100,
      isImport: config?.origin === 'import',
      /* Opportunity cost: How many staff picks were 'swapped' for shop safety */
      bangerOpportunityCost: Math.floor(bangerCost / AVG_LP_COST),
    }
  }, [items, budgetLimit, distributorName])

  const staffRotation = useMemo(() => {
    const sorted = [...allStaff].sort((a, b) => {
      if (b.missed_orders_count !== a.missed_orders_count) {
        return b.missed_orders_count - a.missed_orders_count
      }
      return (
        new Date(a.last_order_participation_at || 0).getTime() -
        new Date(b.last_order_participation_at || 0).getTime()
      )
    })

    const availableSlots = Math.floor(stats.remaining / AVG_LP_COST)

    return sorted.map((person, index) => ({
      ...person,
      status: index < availableSlots ? 'ACTIVE' : 'CUT_OFF',
      rank: index + 1,
    }))
  }, [allStaff, stats.remaining])

  const staffMembersCutOff = staffRotation.filter((p) => p.status === 'CUT_OFF').length
  const nextInLine = staffRotation.find((p) => p.status === 'CUT_OFF')

  const getWealthAdvice = () => {
    if (wealthLevel === 'poor') {
      return stats.bangerRatio < 80
        ? "⚠️ COFFERS LOW: Too many risky picks. Swap some for 'Sure-fire Bangers'."
        : "✅ SAFE: High banger ratio is good for current shop wealth."
    }
    if (wealthLevel === 'wealthy') {
      return "🚀 WEALTHY: You have room to experiment with more deep cuts."
    }
    return "⚖️ OK: Keep a balanced 60/40 mix of Bangers and Risky picks."
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-6">
        {/* COMPOSITION CARD */}
        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  Mission Composition
                </h3>
                <div className="text-3xl font-black mt-1">
                  {stats.bangerRatio.toFixed(0)}% Bangers
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Shop Wealth
                </div>
                <div className="text-xl font-black text-purple-400 uppercase">{wealthLevel}</div>
              </div>
            </div>

            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex border border-white/10">
              <div
                style={{ width: `${stats.bangerRatio}%` }}
                className="h-full bg-blue-500 transition-all duration-700"
              />
              <div
                style={{ width: `${100 - stats.bangerRatio}%` }}
                className="h-full bg-purple-600 transition-all duration-700"
              />
            </div>

            <p className="mt-6 text-sm font-bold text-gray-300 italic">{getWealthAdvice()}</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        </div>

        {/* TRADE-OFF ANALYSIS */}
        <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-6 shadow-inner">
          <div className="flex items-start gap-4">
            <div className="bg-orange-600 text-white p-2 rounded-lg text-lg">⚖️</div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black uppercase text-orange-800 tracking-widest mb-1">
                Participation Trade-off
              </h4>
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                Prioritizing shop stability affects team participation.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-3 rounded-xl border border-orange-200">
                  <div className="text-[9px] font-black text-orange-400 uppercase">
                    Banger Overhead
                  </div>
                  <div className="text-sm font-black text-orange-900">
                    {stats.bangerOpportunityCost} Potential Picks
                  </div>
                </div>

                <div className="bg-white/50 p-3 rounded-xl border border-orange-200">
                  <div className="text-[9px] font-black text-orange-400 uppercase">
                    Staff Left Out
                  </div>
                  <div className="text-sm font-black text-red-600">
                    {staffMembersCutOff} Team Members
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-orange-200 text-[10px] font-bold text-orange-800 italic text-center uppercase">
            {nextInLine ? (
              <>
                Free up <span className="font-black text-red-600">{formatCurrency(AVG_LP_COST)}</span> to
                include <span className="underline">{nextInLine.name}</span> in this order.
              </>
            ) : (
              'Full team participation achieved.'
            )}
          </div>
        </div>

        {/* CUSTOMS WARNING */}
        {stats.isImport && (
          <div
            className={`p-6 rounded-2xl border-2 flex justify-between items-center ${
              stats.totalLanded > 900 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}
          >
            <div>
              <h4
                className={`text-xs font-black uppercase ${
                  stats.totalLanded > 900 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                Customs Threshold Tracker
              </h4>
              <p className="text-sm font-medium text-gray-600">
                Keep batches under $1,000 NZD to avoid extra duty.
              </p>
            </div>
            <div
              className={`text-2xl font-black ${
                stats.totalLanded > 900 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {formatCurrency(stats.totalLanded)}
            </div>
          </div>
        )}

        {/* ITEM SUMMARY TABLE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="p-4">Investor / Staff</th>
                <th className="p-4">Item</th>
                <th className="p-4 text-right">Cost (Landed)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.staffPicks.map((item, i) => (
                <tr key={i} className="text-sm">
                  <td className="p-4 font-black text-blue-600 uppercase text-[10px]">
                    {item.investor_name || 'SHOP'}
                  </td>
                  <td className="p-4 font-bold">
                    {item.artist} - {item.title}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-400">
                    ${(item.price * 1.15).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RIGHT COLUMN: BUDGET & ROTATION --- */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            Budget Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Total Landed</span>
              <span className="text-lg font-black">{formatCurrency(stats.totalLanded)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-sm font-bold text-gray-500">Customer Orders</span>
              <span className="text-sm font-bold text-blue-600">
                -
                {formatCurrency(
                  stats.customerOrders.reduce((s, i) => s + i.price * 1.15, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-black uppercase text-gray-900">Available</span>
              <span className="text-2xl font-black text-green-600">
                {formatCurrency(stats.remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Auto-Rotation Priority
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {staffRotation.map((person) => (
              <div
                key={person.id}
                className={`p-4 flex justify-between items-center ${
                  person.status === 'CUT_OFF' ? 'bg-gray-50/50 grayscale opacity-40' : ''
                }`}
              >
                <div>
                  <div className="text-xs font-black text-gray-900 uppercase">{person.name}</div>
                  {person.missed_orders_count > 0 && (
                    <div className="text-[9px] font-black text-orange-500 uppercase">
                      Debt: {person.missed_orders_count} Missed
                    </div>
                  )}
                </div>
                {person.status === 'ACTIVE' ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                ) : (
                  <span className="text-[8px] font-black text-red-500 uppercase">Next Order</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}