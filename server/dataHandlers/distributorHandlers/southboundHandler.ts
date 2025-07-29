// server/dataHandlers/distributorHandlers/southboundHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

// Helper function to safely get and trim a string value from a cell
function getSafeTrimmedString(cell: exceljs.Cell): string | null {
  if (cell.value === null || cell.value === undefined) {
    return null
  }

  let rawString: string

  if (typeof cell.value === 'string') {
    rawString = cell.value
  } else if (
    typeof cell.value === 'object' &&
    Object.prototype.hasOwnProperty.call(cell.value, 'text')
  ) {
    rawString = String((cell.value as { text: string }).text)
  } else {
    rawString = String(cell.value)
  }

  const trimmed = rawString.trim()
  if (trimmed === '') {
    return null
  }

  const unescapedString = trimmed.replace(/''/g, "'")

  return unescapedString
}

export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
  console.log(`[Southbound Handler] Processing row number: ${row.number}`)

  const formatCell = row.getCell(6)
  let formatValue: string | null = null

  console.log(
    `[Southbound Handler] Row ${row.number}, Column F (Format) raw value:`,
    formatCell.value
  )
  console.log(
    `[Southbound Handler] Row ${row.number}, Column F (Format) type:`,
    typeof formatCell.value
  )

  if (formatCell.value !== null && formatCell.value !== undefined) {
    if (typeof formatCell.value === 'string') {
      formatValue = formatCell.value.trim()
    } else if (typeof formatCell.value === 'number') {
      console.warn(
        `[Southbound Handler] Row ${row.number}: Format cell (F) contains a number. Converting to string.`
      )
      formatValue = String(formatCell.value).trim()
    } else if (
      typeof formatCell.value === 'object' &&
      Object.prototype.hasOwnProperty.call(formatCell.value, 'text')
    ) {
      console.warn(
        `[Southbound Handler] Row ${row.number}: Format cell (F) contains an object with 'text' property. Extracting text.`
      )
      formatValue = String((formatCell.value as { text: string }).text).trim()
    } else if (typeof formatCell.value === 'boolean') {
      console.warn(
        `[Southbound Handler] Row ${row.number}: Format cell (F) contains a boolean. Converting to string.`
      )
      formatValue = String(formatCell.value).trim()
    }
  }
  if (formatValue === '') {
    formatValue = null
  }
  console.log(
    `[Southbound Handler] Row ${row.number}, Processed Format value:`,
    formatValue
  )

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: 'Southbound',
    catalogue_number: getSafeTrimmedString(row.getCell(1)), // Column A: Cat No
    description: getSafeTrimmedString(row.getCell(2)), // Column B: Description
    artist: getSafeTrimmedString(row.getCell(3)), // Column C: Artist
    title: getSafeTrimmedString(row.getCell(4)), // Column D: Title
    format: formatValue, // Use the already processed formatValue here
    barcode: getSafeTrimmedString(row.getCell(7)), // Column G: BarCode
    label: 'Southbound', // Static label
    price: null,
    released: null,
    discogs_release_date: null,
    genres: null,
    bin_location: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
  }

  const priceCell = row.getCell(5)
  const priceValue = priceCell.value
  console.log(
    `[Southbound Handler] Row ${row.number}, Column E (Price) raw value:`,
    priceValue
  )
  console.log(
    `[Southbound Handler] Row ${row.number}, Column E (Price) type:`,
    typeof priceValue
  )

  rowData.price =
    typeof priceValue === 'number'
      ? priceValue
      : typeof priceValue === 'string'
      ? parseFloat(priceValue)
      : null

  console.log(
    `[Southbound Handler] Row ${row.number}, Processed Price value:`,
    rowData.price
  )

  return rowData
}
