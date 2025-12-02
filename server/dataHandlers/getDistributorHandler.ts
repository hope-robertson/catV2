// server/dataHandlers/getDistributorHandler.ts

import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
// ⭐ ASSUMPTION: 'processCsvFile' is the correct function name in your 'csvHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

// Import all specific mapping and handler functions
import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
// ⭐ Import dedicated handlers for complex imports
import { handleRhythmethodGroupUpload } from './distributorHandlers/rhythmethodGroupHandler.js'
// ⭐ You will need to create 'handleCollectiveUpload' if you want a dedicated handler
// import { handleCollectiveUpload } from './distributorHandlers/collectiveHandler.js'


// Centralized configuration for all distributors
const distributorConfigurations: DistributorConfig[] = [
  // 1. Border Music (Corrected header skip)
  {
    name: 'Border Music',
    value: 'Border Music',
    rawTableName: 'border_music_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 4, // ⭐ Border Music requires skipping 4 rows
    requiresFormatFilter: false,
  },

  // 2. Flying Nun Records Limited (CSV)
  {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    rawTableName: 'flying_nun_records_limited_raw',
    fileType: 'csv',
    accept: '.csv,text/csv', // Added text/csv for robustness
    headerRowsToSkip: 4, // ⭐ Confirmed: 4 rows above header
    requiresFormatFilter: false, // Updated, as we filter based on format within the mapper/handler
  },

  // 3. Southbound (Unchanged)
  {
    name: 'Southbound',
    value: 'Southbound',
    rawTableName: 'southbound_instock_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 7,
    requiresFormatFilter: true,
  },

  // 4. Collective (LP & CD, Corrected header skip)
  {
    name: 'Collective (LP)',
    value: 'Collective (LP)',
    rawTableName: 'collective_lp_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1, // ⭐ Confirmed: Data starts row 2 (skip 1 header row)
    requiresFormatFilter: true,
  },
  {
    name: 'Collective (CD)',
    value: 'Collective (CD)',
    rawTableName: 'collective_cd_raw', // Corrected raw table name
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1, // ⭐ Confirmed: Data starts row 2 (skip 1 header row)
    requiresFormatFilter: true,
  },

  // 5. Rhythmethod Group (Simplified to ONE entry pointing to the combined handler)
  {
    name: 'Rhythmethod Group Combined',
    value: 'Rhythmethod Group Combined', // Use a single value for the combined handler
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2,
    requiresFormatFilter: true, // The handler code determines which sheets (LP/CD/All) to process
  },
]

// The 'export' keyword here makes the function available for other files to import
export function getDistributorConfig(
  distributorValue: string
): DistributorConfig | undefined {
  return distributorConfigurations.find(
    (config) => config.value === distributorValue
  )
}

export function getDistributorDataHandler(
  config: DistributorConfig
): DistributorHandler {
  switch (config.value) {
    case 'Border Music':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found for Border Music')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          mapBorderMusicRow,
          config.value, // Pass distributor value to mapper
          formatType
        )
      }

  // ⭐ Flying Nun now uses the 'processCsvFile' utility we assumed
    case 'Flying Nun Records Limited':
      return async (filePath, formatType) => {
        return processCsvRows( // Renamed to align with standard convention
          filePath,
          config.headerRowsToSkip as number,
          mapFlyingNunRow,
          config.value, // Pass distributor value to mapper
          formatType
        )
      }

    case 'Southbound':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found for Southbound')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          mapSouthboundRow,
          config.value, // Pass distributor value to mapper
          formatType
        )
      }
      
  // ⭐ Collective (LP & CD)
    case 'Collective (LP)':
    case 'Collective (CD)':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found for Collective')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          // Pass the current config value (Collective (LP) or Collective (CD)) to the mapper
          (row) => mapCollectiveRow(row, config.value), 
          config.value, // Pass distributor value to excelRows helper
          formatType
        )
      }
      
  // ⭐ Rhythmethod Group Combined (Uses the dedicated handler we built)
    case 'Rhythmethod Group Combined':
      // The handler itself manages reading the file and processing multiple sheets
      return handleRhythmethodGroupUpload 
      
    default:
      throw new Error(
        `No specific data handler found for distributor: ${config.value}`
      )
  }
}

// Export the full configurations list, useful for frontend dropdowns
export { distributorConfigurations }