import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapRhythmethodGroupRow(
  row: exceljs.Row,
  actualDistributor: string,
): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value
  const getText = (col: number) => {
    const val = getVal(col)
    return val ? val.toString().trim() : null
  }

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  const description = getText(3) || ''
  const separator = ' - '
  const dashIndex = description.indexOf(separator)

  let artist =
    dashIndex !== -1 ? description.substring(0, dashIndex).trim() : null
  let title =
    dashIndex !== -1
      ? description.substring(dashIndex + separator.length).trim()
      : description

  // 🛠️ ENHANCED FORMAT LOGIC
  // This looks for common format words at the end of the title.
  // Including "VINYL" so "AMERICAN DREAM VINYL" results in Title: "AMERICAN DREAM"
  let format = null
  const formatMatch = title.match(
    /\s+(\d?LP|CD|7"|2LP|EP|VINYL|PICTURE DISC|DVD)\s*$/i,
  )
  if (formatMatch) {
    format = formatMatch[1].trim().toUpperCase()
    // We keep the title clean so the "Unique Key" is consistent
    title = title.replace(formatMatch[0], '').trim()
  }

  const rawSoh = getText(6)
  const cleanSoh = rawSoh ? parseInt(rawSoh.replace(/[^0-9]/g, '')) : 0

  return {
    imported_at: new Date(),
    distributor: actualDistributor, // 👈 Passed from the route
    catalogue_number: getText(2),
    barcode: getText(4),
    artist,
    title,
    price: getPrice(5),
    format: format || 'VINYL', // Default to VINYL if not found in these specific sheets
    stock_on_hand: cleanSoh,
    label: actualDistributor,
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null,
    genres: null,
  }
}
