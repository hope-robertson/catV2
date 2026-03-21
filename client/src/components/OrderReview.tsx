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
  distributorName 
}: Props) {
  const AVG_LP_COST = 35 // The "Floor" for a staff pick

  // 1. 🧮 CALCULATE TOTALS & CATEGORIES
  const stats = useMemo(() => {
    const customerOrders = items.filter((i) => i.customer_id || i.is_customer_order)
    const staffPicks = items.filter((i) => !i.customer_id && !i.is_customer_order)
    
    // Logic: 4+ stars is a Banger, everything else is "Risky/Deep Cut"
    const bangers = staffPicks.filter((i) => (i.rating || 0) >= 4)
    const risky = staffPicks.filter((i) => (i.rating || 0) < 4)
    
    const totalWholesale = items.reduce((sum, i) => sum + (i.price || 0), 0)
    const config = Object.values(DISTRIBUTOR_CONFIGS).find(c => c.name === distributorName)
    
    // Landed calculation includes GST (1.15) and Freight
    const freightTotal = items.length * (config?.defaultFreightPerItem || 0)
    const totalLanded = (totalWholesale * 1.15) + freightTotal

    return {
      customerOrders,
      staffPicks,
      bangers,
      risky,
      totalLanded,
      remaining: budgetLimit - totalLanded,
      bangerRatio: (bangers.length / (staffPicks.length || 1)) * 100,
      isImport: config?.origin === 'import'
    }
  }, [items, budgetLimit, distributorName])

  // 2. 🔄 ROTATION LOGIC (The Priority Wheel)
  const staffRotation = useMemo(() => {
    // Sort by Missed Orders (Debt) first, then by time since last pick
    const sorted = [...allStaff].sort((a, b) => {
      if (b.missed_orders_count !== a.missed_orders_count) {
        return b.missed_orders_count - a.missed_orders_count
      }
      return new Date(a.last_order_participation_at || 0).getTime() - 
             new Date(b.last_order_participation_at || 0).getTime()
    })

    // How many staff picks can we actually afford with what's left?
    const availableSlots = Math.floor(stats.remaining / AVG_LP_COST)

    return sorted.map((person, index) => ({
      ...person,
      status: index < availableSlots ? 'ACTIVE' : 'CUT_OFF',
      rank: index + 1
    }))
  }, [allStaff, stats.remaining])

  // 3. 💡 WEALTH ADVICE
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
      
      {/* --- LEFT COLUMN: RATIO & GAUGE --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Mission Composition</h3>
                <div className="text-3xl font-black mt-1">{stats.bangerRatio.toFixed(0)}% Bangers</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shop Wealth</div>
                <div className="text-xl font-black text-purple-400 uppercase">{wealthLevel}</div>
              </div>
            </div>

            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex border border-white/10">
              <div style={{ width: `${stats.bangerRatio}%` }} className="h-full bg-blue-500 transition-all duration-700" />
              <div style={{ width: `${100 - stats.bangerRatio}%` }} className="h-full bg-purple-600 transition-all duration-700" />
            </div>
            
            <p className="mt-6 text-sm font-bold text-gray-300 italic">
              {getWealthAdvice()}
            </p>
          </div>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        </div>

        {/* CUSTOMS WARNING (Only for Imports) */}
        {stats.isImport && (
          <div className={`p-6 rounded-2xl border-2 flex justify-between items-center ${
            stats.totalLanded > 900 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div>
              <h4 className={`text-xs font-black uppercase ${stats.totalLanded > 900 ? 'text-red-600' : 'text-green-600'}`}>
                Customs Threshold Tracker
              </h4>
              <p className="text-sm font-medium text-gray-600">Keep batches under $1,000 NZD to avoid extra duty.</p>
            </div>
            <div className={`text-2xl font-black ${stats.totalLanded > 900 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(stats.totalLanded)}
            </div>
          </div>
        )}

        {/* ITEM LIST SUMMARY */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
           <table className="w-full text-left">
             <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
               <tr>
                 <th className="p-4">Staff Member</th>
                 <th className="p-4">Item</th>
                 <th className="p-4 text-right">Cost (Landed)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {stats.staffPicks.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="p-4 font-black text-blue-600 uppercase text-[10px]">{item.staff_name || 'SHOP'}</td>
                    <td className="p-4 font-bold">{item.artist} - {item.title}</td>
                    <td className="p-4 text-right font-mono text-gray-400">${(item.price * 1.15).toFixed(2)}</td>
                  </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* --- RIGHT COLUMN: STAFF ROTATION & BUDGET --- */}
      <div className="space-y-6">
        
        {/* REMAINING BUDGET CARD */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Budget Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Total Landed</span>
              <span className="text-lg font-black">{formatCurrency(stats.totalLanded)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-sm font-bold text-gray-500">Customer Orders</span>
              <span className="text-sm font-bold text-blue-600">-{formatCurrency(stats.customerOrders.reduce((s, i) => s + (i.price * 1.15), 0))}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-black uppercase text-gray-900">Available</span>
              <span className="text-2xl font-black text-green-600">{formatCurrency(stats.remaining)}</span>
            </div>
          </div>
        </div>

        {/* STAFF ROTATION LIST */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Auto-Rotation Priority</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {staffRotation.map((person) => (
              <div key={person.id} className={`p-4 flex justify-between items-center ${person.status === 'CUT_OFF' ? 'bg-gray-50/50 grayscale opacity-40' : ''}`}>
                <div>
                  <div className="text-xs font-black text-gray-900 uppercase">{person.name}</div>
                  {person.missed_orders_count > 0 && (
                    <div className="text-[9px] font-black text-orange-500 uppercase">Debt: {person.missed_orders_count} Missed</div>
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