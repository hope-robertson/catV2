export function getStaffPriorityList(staff: any[], remainingBudget: number) {
  const AVG_LP_COST = 35

  // 1. Sort by: Most Missed Orders first, then Longest Time since last pick
  const sortedStaff = [...staff].sort((a, b) => {
    if (b.missed_orders_count !== a.missed_orders_count) {
      return b.missed_orders_count - a.missed_orders_count
    }
    return new Date(a.last_order_participation_at).getTime() - 
           new Date(b.last_order_participation_at).getTime()
  })

  // 2. Calculate how many slots we can actually afford
  const availableSlots = Math.floor(remainingBudget / AVG_LP_COST)

  // 3. Mark who is "In" and who is "Priority Next"
  return sortedStaff.map((person, index) => ({
    ...person,
    status: index < availableSlots ? 'ACTIVE' : 'CUT_OFF',
    priorityRank: index + 1
  }))
}