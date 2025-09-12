// server/routes/catalogue.ts

import { Router, Request, Response } from 'express'
import checkJwt from '../../server/auth0/index.js' // Assuming checkJwt middleware is here
import * as db from '../db/catalogue.ts' // Your database functions
import exceljs from 'exceljs'
import path from 'path'
import fs from 'fs' // For reading the uploaded file stream
import csv from 'csv-parser' // For parsing CSV files
import { mapXlsxRow, mapCsvRow, CatalogueRow } from './catalogueMapping.js' // Import mapping functions and CatalogueRow interface

const router = Router()

// Define accepted format types (for the new filter)
type FormatType = 'LP' | 'CD' | 'All'

router.post('/import', checkJwt, async (req: Request, res: Response) => {
  try {
    const filename = req.body.filename as string // Name of the uploaded file
    const distributor = req.body.distributor as string // Selected distributor from frontend dropdown
    const formatType = (req.body.formatType || 'All') as FormatType // New: 'LP', 'CD', or 'All'

    if (!filename || !distributor) {
      return res
        .status(400)
        .json({ message: 'Filename and distributor are required.' })
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', filename)
    const fileExtension = path.extname(filename).toLowerCase()
    const dataToInsert: CatalogueRow[] = []

    // --- Define the mapping for Excel sheet names to internal distributor names ---
    // This is crucial for multi-tab Excel files (like Rhythmethod/Warner/Sony combined)
    // Ensure these keys exactly match the tab names in your Excel file.
    // The values should match the 'distributor' value you want in the database.
    const excelSheetToDistributorMap: Record<string, string> = {
      Sony: 'Sony', // Example: Tab named 'Sony' -> distributor 'Sony'
      Warner: 'Warner', // Example: Tab named 'Warner' -> distributor 'Warner'
      Rhythmethod: 'Rhythmethod (RM)', // Example: Tab named 'Rhythmethod' -> distributor 'Rhythmethod (RM)'
      // Add other specific tab names if you have a combined file for Collective, etc.
    }

    // Determine how many header rows to skip for each distributor's Excel file
    // This assumes the actual data starts right after the header rows.
    const headerRowsToSkip: Record<string, number> = {
      'Border Music': 3, // Skip 3 rows: Row 1 (BORDER MUSIC LIMITED), Row 2 (Vinyl in Stock), Row 3 (Actual Headers)
      'Collective (LP)': 1, // Collective LP Excel: Header on Row 1, data starts on Row 2 (skip 1 row)
      'Collective (CD)': 1, // Collective CD Excel: Header on Row 1, data starts on Row 2 (skip 1 row)
      'Southbound': 4, // Southbound Excel: Headers on Row 5, data starts on Row 6 (skip 4 rows)
      // 'Juno': 1, // Commented out Juno for now
      // For combined Rhythmethod sheets, the logic below handles multiple sheets,
      // and we'll apply a common skip for their individual sheet headers.
      'Rhythmethod_Group_Combined_LP': 1, // Each tab in combined Excel should also skip its header
      'Rhythmethod_Group_Combined_CD': 1, // Each tab in combined Excel should also skip its header
      // Add more as needed
    };


    // --- Main File Type Handling Logic ---
    if (fileExtension === '.xlsx') {
      const workbook = new exceljs.Workbook()
      try {
        await workbook.xlsx.readFile(filePath)

        // If it's a combined Rhythmethod/Warner/Sony file (identified by specific distributor from frontend)
        // NOTE: Frontend now sends 'Rhythmethod_Group_Combined_LP' or '_CD'
        if (distributor.startsWith('Rhythmethod_Group_Combined')) { // Updated check
          // Iterate through specific sheets within the combined Excel file
          for (const sheetName of Object.keys(excelSheetToDistributorMap)) {
            const worksheet = workbook.getWorksheet(sheetName) // Get worksheet by its exact name

            if (worksheet) {
              const currentDistributorForSheet =
                excelSheetToDistributorMap[sheetName]
              // Assume each sheet within the combined Excel has a single header row to skip
              const numRowsToSkip = headerRowsToSkip[distributor] || 1; // Default to 1 if not specified

              worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber > numRowsToSkip) { // Skip determined number of header rows
                  const rowData = mapXlsxRow(row, currentDistributorForSheet)

                  // Apply formatType filter if specified
                  // The frontend for Rhythmethod combined already sets formatType, so this is crucial.
                  if (
                    formatType === 'All' || // 'All' for files like Flying Nun which don't auto-filter
                    rowData.format?.toLowerCase() === formatType.toLowerCase() ||
                    // For Rhythmethod combined, we explicitly rely on frontend formatType
                    // and may need to ensure mapXlsxRow correctly sets rowData.format
                    // based on content if not explicitly mapped from columns.
                    // For now, it's assumed mapXlsxRow sets format based on column value or defaults.
                    (distributor === 'Rhythmethod_Group_Combined_LP' && rowData.format?.toLowerCase() === 'lp') ||
                    (distributor === 'Rhythmethod_Group_Combined_CD' && rowData.format?.toLowerCase() === 'cd')
                  ) {
                    dataToInsert.push(rowData)
                  }
                }
              })
            } else {
              console.warn(
                `Worksheet '${sheetName}' not found in the uploaded combined Excel file. Skipping.`,
            