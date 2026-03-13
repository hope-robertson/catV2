// server/dataHandlers/distributorHandlers/flyingNunHandler.ts
import { CatalogueRow } from '../../types/catalogue.js'

export function mapFlyingNunRow(data: Record<string, string>): CatalogueRow {
  const getPrice = (val: string) => {
    const parsed = parseFloat(val?.replace(/[^0-9.]/g, '') || '0')
    return isNaN(parsed) ? null : parsed
  }

  let itemName = data['Item Name']?.trim() || ''
  const itemCode = data['Item Code']?.trim() || null
  const price = getPrice(data['Unit Sale Price'])

  // 1. Clean encoding artifacts
  itemName = itemName.replace(/‚Ä¢/g, '•').replace(/Äì/g, '-')

  // 2. Remove redundant Item Code prefix
  if (itemCode && itemName.startsWith(itemCode)) {
    itemName = itemName
      .replace(itemCode, '')
      .replace(/^[:\s-]+/, '')
      .trim()
  }

  let artist = null
  let title = itemName
  let format = null

  // --- FORMAT DETECTION LOGIC ---

  // A. Check for format in brackets: "Title (CD)"
  const bracketMatch = itemName.match(/(.+?)\s*\(([^)]+)\)\s*$/)
  if (bracketMatch) {
    title = bracketMatch[1].trim()
    format = bracketMatch[2].trim()
  }
  // B. Check for format at the end without brackets: "Title Black LP" or "Title EP"
  else {
    const tailMatch = itemName.match(
      /(.+?)\s+(LP|CD|EP|7"|Cassette|Black LP|Vinyl LP|BLK LP)$/i,
    )
    if (tailMatch) {
      title = tailMatch[1].trim()
      format = tailMatch[2].trim()
    }
  }

  // C. Fallback: If format is still null, look at the Item Code suffix
  if (!format && itemCode) {
    const code = itemCode.toUpperCase()
    if (code.endsWith('LP')) format = 'LP'
    else if (code.endsWith('CD')) format = 'CD'
    else if (code.endsWith('EP')) format = 'EP'
    else if (code.endsWith('CS')) format = 'Cassette'
  }

  // --- ARTIST / TITLE SEPARATION ---
  const splitMatch = title.match(/^(.+?)\s*[:\-–—]\s*(.+)$/)
  if (splitMatch) {
    artist = splitMatch[1].trim()
    title = splitMatch[2].trim()
  }

  if (artist?.toLowerCase().includes('various')) artist = 'Various'

  return {
    imported_at: new Date(),
    distributor: 'Flying Nun Records Limited',
    item_code: itemCode,
    catalogue_number: itemCode,
    barcode: null,
    artist: artist || 'Unknown Artist',
    title: title,
    format: format || 'Vinyl', // Default to Vinyl for FN if unknown
    price: price,
    is_nz_music: true,
    label: 'Flying Nun',
    genres: null,
    released: null,
    bin_location: null,
    unit_sale_price_excl_gst: price,
  }
}
