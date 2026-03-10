import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapRhythmethodGroupRow(row: exceljs.Row, actualDistributor: string): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value
  const getText = (col: number) => getVal(col)?.toString().trim() || null

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
  const separator = " - "
  const dashIndex = description.indexOf(separator)
  
  let artist = dashIndex !== -1 ? description.substring(0, dashIndex).trim() : null
  let title = dashIndex !== -1 ? description.substring(dashIndex + separator.length).trim() : description

  // Extract common format suffixes from the end of the title
  let format = null
  const formatMatch = title.match(/\s+(\d?LP|CD|7"|2LP|EP|VINYL)\s*$/i)
  if (formatMatch) {
    format = formatMatch[1].trim()
    title = title.replace(formatMatch[0], '').trim()
  }

  // Handle SOH (e.g., "10+" becomes 10)
  const rawSoh = getText(6)
  const cleanSoh = rawSoh ? parseInt(rawSoh.replace(/[^0-9]/g, '')) : 0

  return {
    imported_at: new Date(),
    distributor: actualDistributor,
    catalogue_number: getText(2),
    barcode: getText(4),
    artist,
    title,
    price: getPrice(5),
    format,
    stock_on_hand: cleanSoh,
    label: actualDistributor,
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null,
    genres: null
  }
}