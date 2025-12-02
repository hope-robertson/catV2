// server/dataHandlers/distributorHandlers/collectiveHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapCollectiveRow(
  row: exceljs.Row,
  distributor: string // This will be 'Collective (LP)' or 'Collective (CD)'
): CatalogueRow {
  // Column indices start from 1 (Column A).
  const priceValue = row.getCell(6).value // Column F: PRICE
  const barcodeValue = row.getCell(4).value // Column D: BARCODE

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: distributor,
    // Map to correct columns:
    artist: (row.getCell(1).value as string | undefined) || null, // Column A: ARTIST
    title: (row.getCell(2).value as string | undefined) || null, // Column B: TITLE
    catalogue_number: (row.getCell(3).value as string | undefined) || null, // Column C: CAT #
    barcode: barcodeValue ? String(barcodeValue) : null, // Column D: BARCODE
    format: (row.getCell(5).value as string | undefined) || null, // Column E: FORMAT
    
    label: 'Collective', // Static label
    description: null,
    released: null,
    discogs_release_date: null,
    genres: null,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,

    // Add standardized fields (not provided in source data, so default to null/false)
    is_nz_music: false,
    stock_on_hand: null,
  }

  rowData.price =
    typeof priceValue === 'number'
      ? priceValue
      : typeof priceValue === 'string'
      ? parseFloat(priceValue.replace('$', '').trim())
      : null
      
  return rowData
}