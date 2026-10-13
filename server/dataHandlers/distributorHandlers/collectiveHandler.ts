// server/dataHandlers/distributorHandlers/collectiveHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapCollectiveRow(
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

  // 🎯 Correctly mapped to Excel columns:
  // 1: ARTIST, 2: TITLE, 3: CAT #, 4: BARCODE, 5: FORMAT, 6: PRICE
  const artist = getText(1)
  let title = getText(2) || ''
  const catalogue_number = getText(3)
  const barcode = getText(4)
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
    label: 'Collective',
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null,
    genres: null,
  }
}
