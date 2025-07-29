// server/utils/excelHelpers.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../types/catalogue.js' // Assuming CatalogueRow is defined here

/**
 * Reads an XLSX file and returns a specified worksheet.
 * @param filePath The path to the XLSX file.
 * @param sheetName Optional: The name of the worksheet to retrieve. If not provided, returns the first worksheet.
 * @returns The worksheet object or null if not found.
 */
export async function getWorksheet(
  filePath: string,
  sheetName?: string
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
 * @param filePath The path to the XLSX file.
 * @returns An array of worksheet objects.
 */
export async function getAllWorksheets(
  filePath: string
): Promise<exceljs.Worksheet[]> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)
  return workbook.worksheets
}

/**
 * Iterates through rows of a worksheet and applies a mapping function, with optional filtering.
 * @param worksheet The exceljs Worksheet object.
 * @param numRowsToSkip The number of header rows to skip.
 * @param mapRowFunction The function to map an exceljs Row to a CatalogueRow.
 * @param distributorForMapping The actual distributor name to pass to mapRowFunction.
 * @param filterFormat Optional: 'LP' | 'CD' | 'All' to filter by format.
 * @returns An array of mapped CatalogueRow objects.
 */
export function processExcelRows(
  worksheet: exceljs.Worksheet,
  numRowsToSkip: number,
  mapRowFunction: (row: exceljs.Row, distributor: string) => CatalogueRow,
  distributorForMapping: string,
  filterFormat: 'All' | 'LP' | 'CD' = 'All'
): CatalogueRow[] {
  const data: CatalogueRow[] = []
  worksheet.eachRow({ includeEmpty: false }, (row: exceljs.Row, rowNumber) => {
    if (rowNumber > numRowsToSkip) {
      const mappedRow = mapRowFunction(row, distributorForMapping)
      const rowFormat = mappedRow.format?.toLowerCase()
      const desiredFormat = filterFormat.toLowerCase()

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
