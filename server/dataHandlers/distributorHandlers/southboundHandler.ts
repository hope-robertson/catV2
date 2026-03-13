import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  // 1. Explicitly define what each column is
  const colCatNo = row.getCell(1).value
  const colDescription = row.getCell(2).value
  const colDealerPrice = row.getCell(3).value // THIS is the price
  const colFormat = row.getCell(4).value
  const colBarcode = row.getCell(5).value
  const colLabel = row.getCell(6).value
  const colGenre = row.getCell(7).value

  // 2. Surgical Price Extraction (Only looks at colDealerPrice)
  let finalPrice: number | null = null
  if (typeof colDealerPrice === 'number') {
    finalPrice = colDealerPrice
  } else if (colDealerPrice) {
    const cleanPrice = colDealerPrice.toString().replace(/[$,\s]/g, '')
    finalPrice = parseFloat(cleanPrice) || null
  }

  // 3. Simple Artist/Title Split (Only looks at colDescription)
  const desc = colDescription?.toString().trim() || ''
  const separator = ' - '
  const dashIndex = desc.indexOf(separator)

  let artist: string | null = null
  let title: string = desc

  if (dashIndex !== -1) {
    artist = desc.substring(0, dashIndex).trim()
    title = desc.substring(dashIndex + separator.length).trim()
  } else {
    // If no dash, it's a supply/accessory. Use Label (col 6) as artist.
    artist = colLabel?.toString().trim() || null
    title = desc
  }

  // 4. Safe Chop (Only if Title ends exactly with Format)
  const fmt = colFormat?.toString().trim() || ''
  if (fmt && title.endsWith(` ${fmt}`)) {
    title = title.substring(0, title.length - fmt.length).trim()
  }

  // 5. Clean up the Unicode mess
  const cleanTitle = title
    .replace(/¬†/g, ' ')
    .replace(/¬∫/g, 'º')
    .replace(/√£/g, 'ã')
    .replace(/‚Äù/g, '"')
    .replace(/‚Äì/g, '-')

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    catalogue_number: colCatNo?.toString() || null,
    artist: artist,
    title: cleanTitle,
    price: finalPrice,
    format: fmt,
    barcode: colBarcode?.toString() || null,
    label: colLabel?.toString() || null,
    genres: colGenre?.toString() || null,
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: finalPrice,
    released: null,
  }
}
