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

  itemName = itemName.replace(/‚Ä¢/g, '•').replace(/Äì/g, '-')

  if (itemCode && itemName.startsWith(itemCode)) {
    itemName = itemName
      .replace(itemCode, '')
      .replace(/^[:\s-]+/, '')
      .trim()
  }

  let artist = null
  let title = itemName
  let format = null

  // 1. Extract Format but DO NOT remove it from the title if it contains color info
  const bracketMatch = itemName.match(/(.+?)\s*\(([^)]+)\)\s*$/)
  if (bracketMatch) {
    format = bracketMatch[2].trim()
    // We only strip the brackets from the title if they are JUST a standard format like (CD)
    if (['CD', 'LP', 'EP'].includes(format.toUpperCase())) {
      title = bracketMatch[1].trim()
    }
  } else {
    const tailMatch = itemName.match(/(.+?)\s+(LP|CD|EP|7"|Cassette)$/i)
    if (tailMatch) {
      format = tailMatch[2].trim()
      title = tailMatch[1].trim()
    }
  }

  // 2. Artist/Title Split - Now looks for "space-dash-space" to protect Vor-stellen
  // Matches "Artist - Title" or "Artist : Title" but NOT "Vor-stellen"
  const splitMatch = title.match(/^(.+?)\s+[:\-–—]\s+(.+)$/)
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
    title: title, // Color info like "Black LP" stays here if it was in the name
    format: format || 'Vinyl',
    price: price,
    is_nz_music: true,
    label: 'Flying Nun',
    genres: null,
    released: null,
    bin_location: null,
    unit_sale_price_excl_gst: price,
  }
}
