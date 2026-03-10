// server/dataHandlers/distributorHandlers/flyingNunHandler.ts
import { CatalogueRow } from '../../types/catalogue.js'

export function mapFlyingNunRow(data: Record<string, string>): CatalogueRow {
  const getPrice = (val: string) => {
    const parsed = parseFloat(val?.replace(/[^0-9.]/g, '') || '0')
    return isNaN(parsed) ? null : parsed
  }

  // Use the correct header name from your CSV sample
  let itemName = data['Item Name']?.trim() || ''
  const itemCode = data['Item Code']?.trim() || null
  const price = getPrice(data['Unit Sale Price'])

  // 1. Fix Unicode/Bullet points (AK•79)
  itemName = itemName.replace(/‚Ä¢/g, '•').replace(/Äì/g, '-')

  // 2. Remove redundant Item Code prefix if it exists (e.g., "AHR054CD: Ghost Wave...")
  if (itemCode && itemName.startsWith(itemCode)) {
    itemName = itemName.replace(itemCode, '').replace(/^[:\s-]+/, '').trim()
  }

  let artist = null
  let title = itemName
  let format = null

  /**
   * 🔍 Regex Breakdown:
   * ^(.+?)        -> Artist (non-greedy)
   * \s*[:\-–—]\s* -> Separator (Colon or various dashes)
   * (.+?)         -> Title (non-greedy)
   * (?:\s*\(([^)]+)\))? -> Optional Format in brackets at the end
   * \s*$          -> End of string
   */
  const regex = /^(.+?)\s*[:\-–—]\s*(.+?)(?:\s*\(([^)]+)\))?\s*$/i
  const match = itemName.match(regex)

  if (match) {
    artist = match[1].trim()
    title = match[2].trim()
    format = match[3]?.trim() || null
  } else {
    // Fallback: Check if there is just a format in brackets at the end
    const bracketMatch = itemName.match(/(.+?)\s*\(([^)]+)\)\s*$/)
    if (bracketMatch) {
      title = bracketMatch[1].trim()
      format = bracketMatch[2].trim()
    }
  }

  // 3. Final cleanup: If "Various" is in the artist field, keep it as Various
  if (artist?.toLowerCase().includes('various')) artist = 'Various'

  return {
    imported_at: new Date(),
    distributor: 'Flying Nun Records Limited',
    item_code: itemCode,
    catalogue_number: itemCode, // FN usually uses Item Code as Cat No
    barcode: null, // CSV sample doesn't show a barcode column
    artist: artist,
    title: title,
    format: format,
    price: price,
    is_nz_music: true, // It's Flying Nun, so almost everything is NZ music
    label: 'Flying Nun',
    genres: null,
    released: null,
    bin_location: null,
    unit_sale_price_excl_gst: price
  }
}