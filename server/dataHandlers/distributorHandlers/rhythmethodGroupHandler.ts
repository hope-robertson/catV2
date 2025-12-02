// server/dataHandlers/distributorHandlers/rhythmethodGroupHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'
import { processExcelRows } from '../../utils/excelHelpers.js' // Correct import path

// This mapping function is used by the main handler for each sheet within the combined file
export function mapRhythmethodGroupRow(
  row: exceljs.Row,
  actualDistributor: string // This will be 'Rhythmethod (RM)', 'Sony', or 'Warner'
): CatalogueRow {
  // Capture and clean known values from the spreadsheet
  const descriptionValue = row.getCell(3).value as string | undefined // Column C: Description
  const priceValue = row.getCell(5).value // Column E: PPD (Price)
  const stockValue = row.getCell(6).value as number | string | undefined // Column F: SOH

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: actualDistributor, // e.g., 'Rhythmethod (RM)', 'Sony', 'Warner'
    catalogue_number: (row.getCell(2).value as string | undefined) || null, // Column B: Code
    barcode: (row.getCell(4).value as string | undefined) || null, // Column D: Barcode
    
    description: descriptionValue || null, // Store the full description
    is_nz_music: false, // Default to false (no NZ flag in this data)
    stock_on_hand: typeof stockValue === 'number' ? stockValue : null,
    
    price: null, // Will be set below
    artist: null, // Will be set by parsing logic
    title: null, // Will be set by parsing logic
    format: null, // Will be set by parsing logic
    released: null,
    discogs_release_date: null,
    genres: null,
    bin_location: null,
    label: null, // Will be set below
    item_code: null,
    unit_sale_price_excl_gst: null,
  }

  if (rowData.description) { 
    // Updated regex to handle more variations and explicitly check for format codes
    const regex =
      /(.+?)\s*-\s*(.+?)(?:\s*(\d+LP|\d+CD|CD|LP|7"|10"|12"|Cassette|Tape|DVD|Blu-ray|Other|EP))?$/i
    const match = rowData.description.match(regex)

    if (match) {
      rowData.artist = match[1]?.trim() || null
      rowData.title = match[2]?.trim() || null
      rowData.format = match[3]?.trim() || null
    } else {
      // Fallback: if no hyphen or standard format, try to guess artist/title
      const parts = rowData.description.split(' - ')
      if (parts.length >= 2) {
        rowData.artist = parts[0]?.trim() || null
        rowData.title = parts.slice(1).join(' - ').trim() || null
      } else {
        rowData.title = rowData.description.trim() || null
        rowData.artist = null
      }
      // Attempt to extract format from title/description if not in standard spot
      if (!rowData.format) {
        const lowerDesc = rowData.description.toLowerCase()
        if (lowerDesc.includes(' lp')) rowData.format = 'LP'
        else if (lowerDesc.includes(' cd')) rowData.format = 'CD'
        else if (lowerDesc.includes(' 7"')) rowData.format = '7"'
        else if (lowerDesc.includes(' 10"')) rowData.format = '10"'
        else if (lowerDesc.includes(' 12"')) rowData.format = '12"'
        else if (lowerDesc.includes(' cassette')) rowData.format = 'Cassette'
        else rowData.format = null // Default to null if no format found
      }
    }
  }

  rowData.price =
    typeof priceValue === 'number'
      ? priceValue
      : typeof priceValue === 'string'
      ? parseFloat(priceValue.replace('$', ''))
      : null

  // Set label based on the specific sheet's actual distributor
  if (actualDistributor === 'Sony') {
    rowData.label = 'Sony Music'
  } else if (actualDistributor === 'Warner') {
    rowData.label = 'Warner Music'
  } else if (actualDistributor === 'Rhythmethod (RM)') {
    rowData.label = 'Rhythmethod'
  } else {
    rowData.label = null
  }

  return rowData
}

// Helper to map sheet names to the actual distributor names for the DB
function getActualDistributorFromSheet(sheetName: string): string {
  if (sheetName.toLowerCase().includes('rm')) {
    return 'Rhythmethod (RM)'
  } else if (sheetName.toLowerCase().includes('sony')) {
    return 'Sony'
  } else if (sheetName.toLowerCase().includes('warner')) {
    return 'Warner'
  }
  return sheetName // Fallback, though ideally should be handled
}

// Main handler for the combined Rhythmethod Group file
export async function handleRhythmethodGroupUpload(
  filePath: string,
  formatType: 'All' | 'LP' | 'CD'
): Promise<CatalogueRow[]> {
  const allData: CatalogueRow[] = []
  
  // ⭐ FINAL LIST: Processing both Vinyl and CD sheets
  const sheetsToProcess = [
    'RM Vinyl', 
    'Sony Vinyl', 
    'Warner Vinyl',
    'RM CD', 
    'Sony CD', 
    'Warner CD'
];

  const headerRowsToSkip = 2 // Headers on row 2, data on row 3

  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)

  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.getWorksheet(sheetName)
    if (worksheet) {
      const actualDistributorForMap = getActualDistributorFromSheet(sheetName)
      console.log(
        `   Processing sheet '${sheetName}' (Actual Distributor: ${actualDistributorForMap})`
      )

      // Pass a curried function to processExcelRows that includes the actualDistributor
      const sheetData = processExcelRows(
        worksheet,
        headerRowsToSkip,
        (row, distributor) => mapRhythmethodGroupRow(row, distributor), 
        actualDistributorForMap,
        formatType
      )
      allData.push(...sheetData)
    } else {
      console.warn(
        `   Worksheet '${sheetName}' not found in combined Rhythmethod Excel. Skipping.`
      )
    }
  }
  return allData
}