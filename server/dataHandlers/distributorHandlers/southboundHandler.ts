import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value

  const getText = (col: number) => {
    let val = getVal(col)?.toString().trim() || null
    if (!val) return null
    // Fixing Southbound Unicode and stripping @ prefixes
    return val
      .replace(/¬†/g, ' ')
      .replace(/¬∫/g, 'º')
      .replace(/√£/g, 'ã')
      .replace(/‚Äù/g, '"')
      .replace(/‚Äì/g, '-')
      .replace(/‚Ä¶/g, '...')
      .replace(/^@\s*(\(AT\))?\s*/i, '')
      .trim()
  }

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      // FIX: Only strip currency/spaces so "10,000 Maniacs" in Description
      // doesn't leak into the price calculation
      const cleanVal = val.replace(/[$,\s]/g, '')
      const parsed = parseFloat(cleanVal)
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  // Headers: 1:Cat No, 2:Description, 3:Dealer, 4:Format, 5:BarCode, 6:Label, 7:Genre
  const rawDescription = getText(2) || ''
  const formatValue = getText(4) || ''
  const genreValue = getText(7) || ''

  const separator = ' - '
  const dashIndex = rawDescription.indexOf(separator)

  // Logic: Use Genre as fallback Artist for accessories/sleeves
  let artist =
    dashIndex !== -1
      ? rawDescription.substring(0, dashIndex).trim()
      : genreValue || 'Various'
  let title =
    dashIndex !== -1
      ? rawDescription.substring(dashIndex + separator.length).trim()
      : rawDescription

  if (formatValue && title.toLowerCase().endsWith(formatValue.toLowerCase())) {
    const potentialTitle = title
      .substring(0, title.length - formatValue.length)
      .trim()
    if (title.length > formatValue.length) title = potentialTitle
  }

  const dealerPrice = getPrice(3)

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    catalogue_number: getText(1),
    artist,
    title,
    price: dealerPrice,
    format: formatValue,
    barcode: getText(5),
    label: getText(6),
    genres: genreValue,
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: dealerPrice,
    released: null,
  }
}
