import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value

  const getText = (col: number) => {
    let val = getVal(col)?.toString().trim() || null
    if (!val) return null
    return val
      .replace(/¬†/g, ' ')
      .replace(/¬∫/g, 'º')
      .replace(/√£/g, 'ã')
      .replace(/‚Äù/g, '"')
      .replace(/‚Äì/g, '-')
      .replace(/‚Ä¶/g, '...')
      .replace(/^@\s*(\(AT\))?\s*/i, '') // Remove @ and @ (AT)
      .trim()
  }

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const cleanVal = val.replace(/[$,\s]/g, '')
      const parsed = parseFloat(cleanVal)
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  // Column Mapping based on your spreadsheet sample:
  // 1: Cat No, 3: Artist, 4: Title, 5: Dealer (Price), 6: Format, 7: Barcode, 8: Label, 9: Genre
  const rawArtist = getText(3)
  const rawTitle = getText(4) || 'UNKNOWN'
  const formatValue = getText(6) || ''

  let finalTitle = rawTitle

  // Safe Chop: Remove format from title ONLY if it matches the format column
  // This keeps "(olive Green Vinyl)" but removes the trailing "LP"
  if (
    formatValue &&
    finalTitle.toLowerCase().endsWith(formatValue.toLowerCase())
  ) {
    const potentialTitle = finalTitle
      .substring(0, finalTitle.length - formatValue.length)
      .trim()
    if (finalTitle.length > formatValue.length) finalTitle = potentialTitle
  }

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    catalogue_number: getText(1),
    artist: rawArtist || 'Unknown Artist',
    title: finalTitle,
    price: getPrice(5), // Dealer column
    format: formatValue,
    barcode: getText(7),
    label: getText(8),
    genres: getText(9),
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: getPrice(5),
    released: null,
  }
}
