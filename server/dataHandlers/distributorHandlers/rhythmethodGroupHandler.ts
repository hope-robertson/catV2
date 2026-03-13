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

  // 1. Identify Format for the specific column
  let format = 'VINYL' // Default for these spreadsheets
  const lowerDesc = description.toLowerCase()
  if (lowerDesc.includes(' cd')) format = 'CD'
  else if (lowerDesc.includes(' 7"')) format = '7"'
  else if (lowerDesc.includes(' 12"')) format = '12"'
  else if (lowerDesc.includes(' ep')) format = 'EP'
  else if (lowerDesc.includes(' 2lp')) format = '2LP'
  else if (lowerDesc.includes(' dvd')) format = 'DVD'

  // 2. Soft Title Cleaning
  // This ONLY removes the generic "VINYL", "LP", or "CD" if it is the absolute last word.
  // It preserves descriptors like "GOLD NUGGET", "COLOURED", or "ANNIVERSARY".
  title = title.replace(/\s+(VINYL|LP|CD)$/i, '').trim()

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
    genres: null,
  }
}
