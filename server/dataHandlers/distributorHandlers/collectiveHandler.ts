// server/dataHandlers/distributorHandlers/collectiveHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapCollectiveRow(
  row: exceljs.Row,
  distributor: string // This will be 'Collective (LP)' or 'Collective (CD)'
): CatalogueRow {
  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: distributor,
    artist: (row.getCell(1).value as string | undefined) || null, // Column A: ARTIST
    catalogue_number: (row.getCell(2).value as string | undefined) || null, // Column B: CAT #
    barcode: (row.getCell(3).value as string | undefined) || null, // Column C: BARCODE
    format: (row.getCell(4).value as string | undefined) || null, // Column D: FORMAT
    label: 'Collective', // Static label
    title: null, // Collective Excel typically does not have a separate 'Title' column
    description: null,
    released: null,
    discogs_release_date: null,
    genres: null,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
  }
  const priceValue = row.getCell(5).value // Column E: PRICE
  rowData.price =
    typeof priceValue === 'number'
      ? priceValue
      : typeof priceValue === 'string'
      ? parseFloat(priceValue)
      : null
  return rowData
}
