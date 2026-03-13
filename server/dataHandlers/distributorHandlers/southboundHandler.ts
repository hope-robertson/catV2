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

  // SOUTHBOUND INDEX MAPPING:
  // 1: Cat No, 2: Description, 3: Dealer (Price), 4: Format, 5: BarCode, 6: Label, 7: Genre
  const catNo = getText(1)
  const rawDescription = getText(2) || ''
  const priceValue = getPrice(3)
  const formatValue = getText(4)
  const barcodeValue = getText(5)
  const labelValue = getText(6)
  const genreValue = getText(7)

  const separator = ' - '
  const dashIndex = rawDescription.indexOf(separator)

  let finalArtist = null
  let finalTitle = rawDescription

  // Logic: Split only on the first occurrence of " - "
  if (dashIndex !== -1) {
    finalArtist = rawDescription.substring(0, dashIndex).trim()
    finalTitle = rawDescription.substring(dashIndex + separator.length).trim()
  } else {
    // Fallback for accessories (Sleeves, etc.)
    finalArtist = labelValue || null
    finalTitle = rawDescription
  }

  // Safe Chop (Strict): Only remove if it matches the format code exactly
  if (formatValue && finalTitle.endsWith(` ${formatValue}`)) {
    finalTitle = finalTitle
      .substring(0, finalTitle.length - formatValue.length)
      .trim()
  }

  // Mojibake Repair
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
    catalogue_number: catNo,
    barcode: barcodeValue,
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
