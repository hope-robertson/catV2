// server/dataHandlers/distributorHandlers/southboundHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  const getValue = (col: number) =>
    row.getCell(col).value?.toString().trim() || null

  // Split "Artist - Title" from Column 2
  const description = getValue(2) || ''
  const parts = description.split(' - ')
  const artist = parts[0] || null
  const title = parts.slice(1).join(' - ') || description

  return {
    imported_at: new Date(),
    distributor: 'Southbound Distribution Limited',
    catalogue_number: getValue(1),
    artist: artist,
    title: title,
    format: getValue(4),
    barcode: getValue(5),
    price: parseFloat(getValue(3)?.replace(/[^0-9.]/g, '') || '0') || null,
    label: getValue(6),
    genres: getValue(7),
    is_nz_music: false,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
    released: null,
  }
}
