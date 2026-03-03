// server/utils/excelHelpers.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../types/catalogue.js'

/**
 * Reads an XLSX file and returns a specified worksheet.
 */
export async function getWorksheet(
  filePath: string,
  sheetName?: string,
): Promise<exceljs.Worksheet | null> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)

  if (sheetName) {
    return workbook.getWorksheet(sheetName) || null
  } else if (workbook.worksheets.length > 0) {
    return workbook.worksheets[0]
  }
  return null
}

/**
 * Reads all worksheets from an XLSX file.
 */
export async function getAllWorksheets(
  filePath: string,
): Promise<exceljs.Worksheet[]> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)
  return workbook.worksheets
}

/**
 * Iterates through rows of a worksheet and applies a mapping function, with optional filtering.
 */
export function processExcelRows(
  worksheet: exceljs.Worksheet,
  numRowsToSkip: number,
  mapRowFunction: (row: exceljs.Row, distributor: string) => CatalogueRow,
  distributorForMapping: string,
  filterFormat: 'All' | 'LP' | 'CD' = 'All',
): CatalogueRow[] {
  const data: CatalogueRow[] = []

  worksheet.eachRow({ includeEmpty: false }, (row: exceljs.Row, rowNumber) => {
    // Only process rows after the header offset
    if (rowNumber > numRowsToSkip) {
      const mappedRow = mapRowFunction(row, distributorForMapping)

      /**
       * 🛡️ DEFENSIVE FIX:
       * wrap mappedRow.format in String() to handle numbers or null values safely.
       * If mappedRow.format is undefined, it defaults to an empty string.
       */
      const rowFormat = String(mappedRow.format || '').toLowerCase()
      const desiredFormat = filterFormat.toLowerCase()

      // Logic check for filtering
      if (
        desiredFormat === 'all' ||
        (rowFormat && rowFormat.includes(desiredFormat))
      ) {
        data.push(mappedRow)
      }
    }
  })
  return data
}
