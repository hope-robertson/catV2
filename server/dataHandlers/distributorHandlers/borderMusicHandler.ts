// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value
  const getText = (col: number) => getVal(col)?.toString().trim() || null

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (val === null || val === undefined) return null
    if (typeof val === 'number') return val
    const cleanVal = val
      .toString()
      .trim()
      .replace(/[$,\s]/g, '')
    const parsed = parseFloat(cleanVal)
    return isNaN(parsed) ? null : parsed
  }

  let artist = getText(1)
  let title = getText(2)
  const catNo = getText(3)
  const priceValue = getPrice(6)

  // Handle the compilation logic (starts with /)
  if (artist?.startsWith('/')) {
    const rawString = artist.substring(1).trim()
    const ofMatch = rawString.match(/\s+OF\s+/i)

    if (ofMatch && ofMatch.index !== undefined) {
      // Case: "/THE STUDIO WIZARDRY OF TODD RUNDGREN"
      title = rawString
      artist = rawString.substring(ofMatch.index + ofMatch[0].length).trim()
    } else {
      // Case: "/NEW YORK CITY SALSA" -> artist becomes Various
      // We keep the raw title if it exists, or use the rawString as the title
      title = title ? `${rawString} - ${title}` : rawString
      artist = 'Various'
    }
  }
  // If no slash at the start, but contains a slash (Split Release), we leave it alone.
  // The 'artist' variable remains as "Band A / Band B"

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: artist || 'Various', // Fallback to Various for Border if Artist is missing
    title: title || 'UNKNOWN', // Fallback to UNKNOWN for Title
    catalogue_number: catNo,
    barcode: getText(4),
    format: getText(5) || '',
    price: priceValue,
    is_nz_music: !!getText(7)?.toUpperCase().includes('NZ'),
    label: 'Various',
    released: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: priceValue,
  }
}
