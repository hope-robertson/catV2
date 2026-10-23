export const API_BASE =
  import.meta.env.VITE_API_URL || 'https://catv2-production.up.railway.app'

console.log(
  '🚨 DIAGNOSTIC - VITE_API_BASE env value:',
  import.meta.env.VITE_API_BASE,
)
console.log('🚨 DIAGNOSTIC - Final API_BASE chosen:', API_BASE)
