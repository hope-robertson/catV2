// server/routes/distributorHandlers/southboundHandler.ts
import { Row } from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: Row): CatalogueRow {
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

  // 🎯 CORRECTED SOUTHBOUND LAYOUT (Offset by +1 due to Order Qty column):
  // 1: Order Qty (blank), 2: Cat No, 3: Description, 4: Dealer (Price), 5: Format, 6: BarCode, 7: Label, 8: Genre
  const rawDescription = getText(3) || ''
  const priceValue = getPrice(4)
  const formatValue = getText(5)
  const barcodeValue = getText(6)
  const labelValue = getText(7)
  const genreValue = getText(8)

  let finalArtist = null
  let finalTitle = rawDescription

  const splitRegex = /\s*[:\-–—]\s+/
  const match = rawDescription.match(splitRegex)

  if (match && match.index !== undefined) {
    finalArtist = rawDescription.substring(0, match.index).trim()
    finalTitle = rawDescription.substring(match.index + match[0].length).trim()
  } else {
    const d = rawDescription.toLowerCase()
    const isAccessory =
      d.includes('sleeves') || d.includes('cleaning') || d.includes('brush')
    if (isAccessory) finalArtist = labelValue || 'Supplies'
    else finalArtist = null
  }

  if (formatValue && finalTitle.endsWith(` ${formatValue}`)) {
    finalTitle = finalTitle
      .substring(0, finalTitle.length - formatValue.length)
      .trim()
  }

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    artist: finalArtist,
    title: finalTitle,
    catalogue_number: getText(2),
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
