import exceljs from 'exceljs'

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
  is_nz_music: boolean | null // 🔑 Re-enabled
  bin_location: string | null
  item_code: string | null
  unit_sale_price_excl_gst: number | null
  imported_at: Date
  distributor: string
}

export interface CsvRow {
  [key: string]: string | undefined
}

export function mapXlsxRow(
  row: exceljs.Row,
  distributor: string,
): CatalogueRow {
  const cell9Value = row.getCell(9).value
  const cell12Value = row.getCell(12).value

  return {
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
    is_nz_music: null, // Default to null, handlers will override
    bin_location: row.getCell(10).value ? String(row.getCell(10).value) : null,
    item_code: row.getCell(11).value ? String(row.getCell(11).value) : null,
    unit_sale_price_excl_gst:
      cell12Value && typeof cell12Value === 'number' ? cell12Value : null,
    imported_at: new Date(),
    distributor: distributor,
  }
}

export function mapCsvRow(row: CsvRow, distributor: string): CatalogueRow {
  return {
    artist: row['Artist'] || null,
    title: row['Title'] || null,
    label: row['Label'] || null,
    format: row['Format'] || null,
    released: row['Released'] || null,
    description: row['Description'] || null,
    barcode: row['Barcode'] || null,
    catalogue_number: row['Catalogue Number'] || null,
    price: row['Price'] ? parseFloat(row['Price']) : null,
    is_nz_music: null, // 🔑 Re-enabled
    bin_location: row['Bin Location'] || null,
    item_code: row['Item Code'] || null,
    unit_sale_price_excl_gst: row['Unit Sale Price Excl GST']
      ? parseFloat(row['Unit Sale Price Excl GST'])
      : null,
    imported_at: new Date(),
    distributor: distributor,
  }
}
