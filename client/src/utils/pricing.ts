const NZ_GST = 1.15

/**
 * Calculates suggested retail using the 1.85x "Collective/Standard" multiplier.
 * If a manual override exists, that value is returned instead.
 */
export function calculateRetail(
  wholesale: number, 
  manualOverride: number | null = null
): number {
  // 1. If the Captain manually set a price (the "Price Cool?" logic), use it.
  if (manualOverride !== null && manualOverride > 0) {
    return manualOverride
  }

  if (!wholesale || wholesale <= 0) return 0
  
  // 2. Otherwise, use the standard 1.85x markup from the manual
  const rawPrice = wholesale * 1.85
  
  // 3. Apply Swedish Rounding
  return Math.round(rawPrice)
}

/**
 * Formats for the UI (No decimals)
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}