// server/routes/catalogue.ts
import { Router, Request, Response } from 'express'
import checkJwt from '../auth0/index.js'
import * as db from '../db/catalogue.js'
import exceljs from 'exceljs'
import path from 'path'
import fs from 'fs'
import csv from 'csv-parser'
import { mapXlsxRow, mapCsvRow, CatalogueRow } from './catalogueMapping.js'

const router = Router()

// Define accepted format types (for the new filter)
type FormatType = 'LP' | 'CD' | 'All'

router.post('/import', checkJwt, async (req: Request, res: Response) => {
  try {
    const filename = req.body.filename as string
    const distributor = req.body.distributor as string
    const formatType = (req.body.formatType || 'All') as FormatType

    if (!filename || !distributor) {
      return res
        .status(400)
        .json({ message: 'Filename and distributor are required.' })
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', filename)
    const fileExtension = path.extname(filename).toLowerCase()
    const dataToInsert: CatalogueRow[] = []

    const excelSheetToDistributorMap: Record<string, string> = {
      Sony: 'Sony',
      Warner: 'Warner',
      Rhythmethod: 'Rhythmethod (RM)',
    }

    const headerRowsToSkip: Record<string, number> = {
      'Border Music': 3,
      'Collective (LP)': 1,
      'Collective (CD)': 1,
      Southbound: 4,
      Rhythmethod_Group_Combined_LP: 1,
      Rhythmethod_Group_Combined_CD: 1,
    }

    // --- Main File Type Handling Logic ---
    if (fileExtension === '.xlsx') {
      const workbook = new exceljs.Workbook()
      try {
        await workbook.xlsx.readFile(filePath)

        if (distributor.startsWith('Rhythmethod_Group_Combined')) {
          for (const sheetName of Object.keys(excelSheetToDistributorMap)) {
            const worksheet = workbook.getWorksheet(sheetName)

            if (worksheet) {
              const currentDistributorForSheet =
                excelSheetToDistributorMap[sheetName]
              const numRowsToSkip = headerRowsToSkip[distributor] || 1

              worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber > numRowsToSkip) {
                  const rowData = mapXlsxRow(row, currentDistributorForSheet)
                  if (
                    formatType === 'All' ||
                    rowData.format?.toLowerCase() ===
                      formatType.toLowerCase() ||
                    (distributor === 'Rhythmethod_Group_Combined_LP' &&
                      rowData.format?.toLowerCase() === 'lp') ||
                    (distributor === 'Rhythmethod_Group_Combined_CD' &&
                      rowData.format?.toLowerCase() === 'cd')
                  ) {
                    dataToInsert.push(rowData)
                  }
                }
              })
            } else {
              console.warn(
                `Worksheet '${sheetName}' not found in the uploaded combined Excel file. Skipping.`
              )
            }
          }
        } else {
          // Logic for single-sheet Excel files (like Border Music, Collective, etc.)
          const worksheet = workbook.getWorksheet(1)
          if (worksheet) {
            const numRowsToSkip = headerRowsToSkip[distributor] || 0
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              if (rowNumber > numRowsToSkip) {
                const rowData = mapXlsxRow(row, distributor)
                if (
                  formatType === 'All' ||
                  rowData.format?.toLowerCase() === formatType.toLowerCase()
                ) {
                  dataToInsert.push(rowData)
                }
              }
            })
          }
        }
      } catch (excelError) {
        console.error('Error processing Excel file:', excelError)
        return res.status(500).json({ message: 'Error processing Excel file.' })
      }
    } else if (fileExtension === '.csv') {
      // --- CSV File Handling Logic ---
      const numRowsToSkip = headerRowsToSkip[distributor] || 0
      let rowCount = 0
      const stream = fs
        .createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++
          if (rowCount > numRowsToSkip) {
            const rowData = mapCsvRow(row, distributor)
            // Apply formatType filter if specified
            if (
              formatType === 'All' ||
              rowData.format?.toLowerCase() === formatType.toLowerCase()
            ) {
              dataToInsert.push(rowData)
            }
          }
        })
        .on('end', async () => {
          // All data has been collected, now insert into the database
          const insertedCount = await db.importCatalogueData(
            distributor.toLowerCase().replace(/[\s\(\)]/g, '_') + '_raw',
            dataToInsert
          )
          res
            .status(200)
            .json({
              message: `Successfully imported ${insertedCount} records from ${distributor}.`,
            })
        })
        .on('error', (csvError) => {
          console.error('Error processing CSV file:', csvError)
          return res.status(500).json({ message: 'Error processing CSV file.' })
        })
      return // Return early for CSV to handle stream asynchronously
    } else {
      // Handle unsupported file types
      return res
        .status(400)
        .json({
          message: 'Unsupported file type. Please upload a .xlsx or .csv file.',
        })
    }

    // --- Final Database Insertion for .xlsx files ---
    // This part is for Excel files, which are processed synchronously
    const rawTableName =
      distributor.toLowerCase().replace(/[\s\(\)]/g, '_') + '_raw'
    const insertedCount = await db.importCatalogueData(
      rawTableName,
      dataToInsert
    )
    res
      .status(200)
      .json({
        message: `Successfully imported ${insertedCount} records from ${distributor}.`,
      })
  } catch (error) {
    console.error('An error occurred during import:', error)
    res
      .status(500)
      .json({ message: 'An unexpected error occurred during import.' })
  }
})

export default router
