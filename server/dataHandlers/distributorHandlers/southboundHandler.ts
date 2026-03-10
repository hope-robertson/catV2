import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
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

  const rawDescription = getText(2) || ''
  const formatValue = getText(4) || ''
  
  const separator = " - "
  const dashIndex = rawDescription.indexOf(separator)
  
  let artist = dashIndex !== -1 ? rawDescription.substring(0, dashIndex).trim() : null
  let title = dashIndex !== -1 ? rawDescription.substring(dashIndex + separator.length).trim() : rawDescription

  // Safe Chop: Remove format from end of title if it matches the Format column
  if (formatValue && title.toLowerCase().endsWith(formatValue.toLowerCase())) {
    const potentialTitle = title.substring(0, title.length - formatValue.length).trim()
    // Ensure we don't chop if it's the only word in the title
    if (title.length > formatValue.length) title = potentialTitle
  }

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    catalogue_number: getText(1),
    artist,
    title,
    price: getPrice(3),
    format: formatValue,
    barcode: getText(5),
    label: getText(6),
    genres: getText(7),
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null
  }
}