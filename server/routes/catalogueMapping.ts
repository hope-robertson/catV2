// server/routes/catalogueMapping.ts

import exceljs from 'exceljs'
import csv from 'csv-parser'

// This is the interface that defines the structure of a single row of data
// that will be inserted into a raw distributor table.
export interface CatalogueRow {
  artist: string | null
  title: string | null
  label: string | null
  format: string | null
  released: string | null
  description: string | null
  barcode: string | null
  catalogue_number: string | null
  price: number | null
  bin_location: string | null
  item_code: string | null
  unit_sale_price_excl_gst: number | null
  imported_at: Date
  distributor: string
}

// Add this interface to define a generic CSV row object
export interface CsvRow {
  [key: string]: string | undefined
}

/**
 * Maps a single Excel row to a structured CatalogueRow object.
 * This function needs to be customized for each distributor's specific file format.
 * @param row The Excel row object from the exceljs library.
 * @param distributor The name of the distributor, used to guide the mapping logic.
 * @returns A CatalogueRow object.
 */
export function mapXlsxRow(
  row: exceljs.Row,
  distributor: string
): CatalogueRow {
  // We'll get cell values first to ensure they're not undefined before checking their type
  const cell9Value = row.getCell(9).value
  const cell12Value = row.getCell(12).value
  const rowData: CatalogueRow = {
    artist: row.getCell(1).value ? String(row.getCell(1).value) : null,
    title: row.getCell(2).value ? String(row.getCell(2).value) : null,
    label: row.getCell(3).value ? String(row.getCell(3).value) : null,
    format: row.getCell(4).value ? String(row.getCell(4).value) : null,
    released: row.getCell(5).value ? String(row.getCell(5).value) : null,
    description: row.getCell(6).value ? String(row.getCell(6).value) : null,
    barcode: row.getCell(7).value ? String(row.getCell(7).value) : null,
    catalogue_number: row.getCell(8).value
      ? String(row.getCell(8).value)
      : null,
    price: cell9Value && typeof cell9Value === 'number' ? cell9Value : null,
    bin_location: row.getCell(10).value ? String(row.getCell(10).value) : null,
    item_code: row.getCell(11).value ? String(row.getCell(11).value) : null,
    unit_sale_price_excl_gst:
      cell12Value && typeof cell12Value === 'number' ? cell12Value : null,
    imported_at: new Date(),
    distributor: distributor,
  }

  // --- Example: Custom logic for a specific distributor (e.g., Southbound) ---
  if (distributor === 'Southbound') {
    rowData.artist = row.getCell(1).value ? String(row.getCell(1).value) : null
    rowData.title = row.getCell(2).value ? String(row.getCell(2).value) : null
    // ...and so on for other fields based on the Southbound spreadsheet layout
  }

  return rowData
}

/**
 * Maps a single CSV row to a structured CatalogueRow object.
 * @param row The CSV row object.
 * @param distributor The name of the distributor.
 * @returns A CatalogueRow object.
 */
export function mapCsvRow(row: CsvRow, distributor: string): CatalogueRow {
  const rowData: CatalogueRow = {
    // Map the row keys to your CatalogueRow fields
    artist: row['Artist'] || null,
    title: row['Title'] || null,
    label: row['Label'] || null,
    format: row['Format'] || null,
    released: row['Released'] || null,
    description: row['Description'] || null,
    barcode: row['Barcode'] || null,
    catalogue_number: row['Catalogue Number'] || null,
    price: row['Price'] ? parseFloat(row['Price']) : null,
    bin_location: row['Bin Location'] || null,
    item_code: row['Item Code'] || null,
    unit_sale_price_excl_gst: row['Unit Sale Price Excl GST']
      ? parseFloat(row['Unit Sale Price Excl GST'])
      : null,
    imported_at: new Date(),
    distributor: distributor,
  }

  return rowData
}
