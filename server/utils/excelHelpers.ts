import exceljs from 'exceljs'
import { CatalogueRow } from '../types/catalogue.js'

export async function getWorksheet(
  filePath: string,
  sheetName?: string,
): Promise<exceljs.Worksheet | null> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)

  if (sheetName) {
    return workbook.getWorksheet(sheetName) || null
  }
  return workbook.worksheets[0] || null
}

export async function getAllWorksheets(
  filePath: string,
): Promise<exceljs.Worksheet[]> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)
  return workbook.worksheets
}

export function processExcelRows(
  worksheet: exceljs.Worksheet,
  numRowsToSkip: number,
  mapRowFunction: (row: exceljs.Row, distributor: string) => CatalogueRow,
  distributorForMapping: string,
  filterFormat: 'All' | 'LP' | 'CD' = 'All',
): CatalogueRow[] {
  const data: CatalogueRow[] = []
  const desiredFormat = filterFormat.toLowerCase()

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > numRowsToSkip) {
      const mappedRow = mapRowFunction(row, distributorForMapping)
      const rowFormat = String(mappedRow.format || '').toLowerCase()

      if (desiredFormat === 'all' || rowFormat.includes(desiredFormat)) {
        data.push(mappedRow)
      }
    }
  })
  return data
}
