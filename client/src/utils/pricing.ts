export function calculateRetail(cost: number, markup: number = 1.8): number {
  if (!cost || cost <= 0) return 0

  const rawPrice = cost * markup

  return Math.round(rawPrice)
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
