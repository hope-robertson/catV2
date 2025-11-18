// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: (row.getCell(1).value as string | undefined) || null, // Column A: Artist
    title: (row.getCell(2).value as string | undefined) || null, // Column B: Title
    catalogue_number: (row.getCell(3).value as string | undefined) || null, // Column C: Catalogue Number
    barcode: (row.getCell(4).value as string | undefined) || null, // Column D: Bar Code
    format: (row.getCell(5).value as string | undefined) || null, // Column E: Format
    // REMOVED THIS LINE: bin_location: (row.getCell(7).value as string | undefined) || null, // Column G: Bin
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
