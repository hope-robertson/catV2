// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  // Capture the value from Column G (Bin)
  const binValue = row.getCell(7).value as string | undefined

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: (row.getCell(1).value as string | undefined) || null, // Column A: Artist
    title: (row.getCell(2).value as string | undefined) || null, // Column B: Title
    catalogue_number: (row.getCell(3).value as string | undefined) || null, // Column C: Catalogue Number
    barcode: (row.getCell(4).value as string | undefined) || null, // Column D: Bar Code
    format: (row.getCell(5).value as string | undefined) || null, // Column E: Format
    // The explicit bin_location field is still removed, but we map its content:

    // ⭐ NEW FIELD: Maps 'NZ' (or 'nz') to true, anything else to false/null
    is_nz_music: !!(binValue && binValue.toUpperCase().includes('NZ')),

    label: 'Various', // Static label
    description: null,
    released: null,
    discogs_release_date: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
  }
  const priceValue = row.getCell(6).value
  rowData.price =
    typeof priceValue === 'number'
      ? priceValue
      : typeof priceValue === 'string'
      ? parseFloat(priceValue.replace('$', '')) // Ensure '$' is removed if present
      : null
  return rowData
}
