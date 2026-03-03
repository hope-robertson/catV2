// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  const getValue = (col: number) =>
    row.getCell(col).value?.toString().trim() || null
  const binValue = getValue(7)

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: getValue(1),
    title: getValue(2),
    catalogue_number: getValue(3),
    barcode: getValue(4),
    format: getValue(5),
    price: parseFloat(getValue(6)?.replace(/[^0-9.]/g, '') || '0') || null,
    is_nz_music: !!(binValue && binValue.toUpperCase().includes('NZ')),
    label: 'Various',
    released: null,
    discogs_release_date: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
  }
}
