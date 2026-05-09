// server/dataHandlers/distributorHandlers/universalHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapUniversalRow(
  row: exceljs.Row,
  distributor: string,
): CatalogueRow {
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

  // 🎯 MAPPED COLUMNS (Matching Universal Sheet)
  const artist = getText(3)
  let title = getText(4) || ''
  const catalogue_number = getText(2)
  const barcode = getText(1)
  const formatValue = getText(5) || ''

  // Checking if title ends with the same format code as in format column, chops if true
  const formatBase = formatValue.split('-')[0]
  if (formatBase && title.toUpperCase().endsWith(formatBase.toUpperCase())) {
    const potentialTitle = title
      .substring(0, title.toUpperCase().lastIndexOf(formatBase.toUpperCase()))
      .trim()
    if (potentialTitle.length > 0) title = potentialTitle
  }

  return {
    imported_at: new Date(),
    distributor: distributor,
    artist: artist,
    title: title,
    catalogue_number: catalogue_number,
    barcode: barcode,
    format: formatValue,
    price: getPrice(6),
    label: 'Universal', // 🎯 Universal Label
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null,
    genres: null,
  }
}
