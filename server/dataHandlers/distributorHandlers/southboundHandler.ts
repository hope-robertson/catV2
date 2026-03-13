import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
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

  // Column Map: 1:Cat, 2:Description (Source), 5:Price, 6:Format, 8:Label, 9:Genre
  const rawDescription = getText(2) || ''
  const priceValue = getPrice(5)
  const formatValue = getText(6)
  const labelValue = getText(8)
  const genreValue = getText(9)

  let finalArtist = null
  let finalTitle = rawDescription

  /**
   * FLEXIBLE SPLITTER
   * Splits on " - " OR " : "
   * The \s* ensures it handles varying spaces around the separator
   */
  const splitRegex = /\s*[:\-–—]\s+/
  const match = rawDescription.match(splitRegex)

  if (match && match.index !== undefined) {
    finalArtist = rawDescription.substring(0, match.index).trim()
    finalTitle = rawDescription.substring(match.index + match[0].length).trim()
  } else {
    // Handle record sleeves and cleaning supplies
    const d = rawDescription.toLowerCase()
    const isAccessory =
      d.includes('sleeves') ||
      d.includes('cleaning') ||
      d.includes('brush') ||
      d.includes('cloth') ||
      d.includes('stylus')

    if (isAccessory) finalArtist = labelValue || 'Supplies'
    else finalArtist = null
  }

  // Strict Safe Chop: Only remove if title ends with exactly " [Format]"
  if (formatValue && finalTitle.endsWith(` ${formatValue}`)) {
    finalTitle = finalTitle
      .substring(0, finalTitle.length - formatValue.length)
      .trim()
  }

  // Final Encoding Cleanup
  finalTitle = finalTitle
    .replace(/¬†/g, ' ')
    .replace(/¬∫/g, 'º')
    .replace(/√£/g, 'ã')
    .replace(/‚Äù/g, '"')
    .replace(/‚Äì/g, '-')

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    artist: finalArtist,
    title: finalTitle,
    catalogue_number: getText(1),
    barcode: getText(7),
    format: formatValue || '',
    price: priceValue,
    is_nz_music: false,
    label: labelValue || 'Various',
    genres: genreValue,
    released: null,
    item_code: null,
    unit_sale_price_excl_gst: priceValue,
  }
}
