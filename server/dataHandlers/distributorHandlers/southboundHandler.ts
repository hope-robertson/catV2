import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value

  const getText = (col: number) => {
    let val = getVal(col)?.toString().trim() || null
    if (!val) return null
    // Repair Southbound Mojibake (98º, etc)
    return val
      .replace(/¬†/g, ' ')
      .replace(/¬∫/g, 'º')
      .replace(/√£/g, 'ã')
      .replace(/‚Äù/g, '"')
      .replace(/‚Äì/g, '-')
      .replace(/‚Ä¶/g, '...')
      .replace(/Äì/g, '-')
      .trim()
  }

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      // FIX: Only strip currency/spaces.
      // Using /[^0-9.]/ was turning "10,000" inside the name into a price!
      const cleanVal = val.replace(/[$,\s]/g, '')
      const parsed = parseFloat(cleanVal)
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  // Headers: 1:Cat No, 2:Description, 3:Dealer (Price), 4:Format, 5:BarCode, 6:Label, 7:Genre
  const rawDescription = getText(2) || ''
  const formatValue = getText(4) || ''
  const labelValue = getText(6) || ''

  const separator = ' - '
  const dashIndex = rawDescription.indexOf(separator)

  let artist = null
  let title = rawDescription

  // 1. Restore your dash-splitting logic
  if (dashIndex !== -1) {
    artist = rawDescription.substring(0, dashIndex).trim()
    title = rawDescription.substring(dashIndex + separator.length).trim()
  } else {
    // 2. Fix the "Sleeves/Accessories" issue:
    // If it's an accessory, use the Label (Brightwell) instead of 'Various'
    if (formatValue?.toLowerCase().includes('acc')) {
      artist = labelValue || 'Supplies'
    } else {
      artist = 'Various'
    }
  }

  // 3. Restore your Safe Chop
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
    artist: artist,
    title: title,
    price: dealerPrice,
    format: formatValue,
    barcode: getText(5),
    label: labelValue,
    genres: getText(7),
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: dealerPrice,
    released: null,
  }
}
