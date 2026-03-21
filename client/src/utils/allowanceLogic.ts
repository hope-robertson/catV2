/**
 * Calculates how much each staff member has to spend
 * after the "must-haves" are accounted for.
 */
export function calculateStaffAllowance(
  totalBudget: number,
  items: any[],
  staffCount: number,
  estFreight: number = 40 // Default freight buffer
) {
  const customerTotal = items
    .filter(i => i.is_customer_order)
    .reduce((sum, i) => sum + (i.price * 1.15), 0) // Cost + GST

  const remaining = totalBudget - customerTotal - estFreight
  
  return {
    perPerson: Math.max(0, remaining / (staffCount || 1)),
    remainingPool: remaining,
    isStretched: remaining < (staffCount * 35) // If less than $35 per person, it's tight
  }
}