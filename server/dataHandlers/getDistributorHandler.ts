// server/dataHandlers/getDistributorHandler.ts
import {
  DistributorConfig,
  DistributorHandler,
  CatalogueRow,
} from '../types/catalogue.js' // Ensure CatalogueRow is imported
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import {
  handleRhythmethodGroupUpload,
  mapRhythmethodGroupRow,
} from './distributorHandlers/rhythmethodGroupHandler.js' // Import mapRhythmethodGroupRow too
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js' // Import Southbound handler

// Centralized configuration for all distributors
const distributorConfigurations: DistributorConfig[] = [
  {
    name: 'Border Music',
    value: 'Border Music',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 3, // Headers on Row 3, data on Row 4
  },
  {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    fileType: 'csv',
    accept: '.csv',
    headerRowsToSkip: 4, // Skip first 4 lines before CSV data
    requiresFormatFilter: true, // Frontend filter needed for this one
  },
  {
    name: 'Southbound',
    value: 'Southbound',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 7, // Headers on Row 5, data on Row 8 (so skip 7 rows)
    requiresFormatFilter: true, // Frontend filter needed for this one
  },
  {
    name: 'Collective (LP)',
    value: 'Collective (LP)',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1, // Headers on Row 1, data on Row 2
    requiresFormatFilter: true, // Frontend filter needed for this one
  },
  {
    name: 'Collective (CD)',
    value: 'Collective (CD)',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1, // Headers on Row 1, data on Row 2
    requiresFormatFilter: true, // Frontend filter needed for this one
  },
  {
    name: 'Rhythmethod Group (Combined Excel - LPs)',
    value: 'Rhythmethod_Group_Combined_LP',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2, // Headers on Row 2, data on Row 3 (applies to each sub-sheet)
    // No requiresFormatFilter as the value itself implies LP
  },
  {
    name: 'Rhythmethod Group (Combined Excel - CDs)',
    value: 'Rhythmethod_Group_Combined_CD',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2, // Headers on Row 2, data on Row 3 (applies to each sub-sheet)
    // No requiresFormatFilter as the value itself implies CD
  },
]

// Function to get the handler and config for a given distributor
export function getDistributorConfig(
  distributorValue: string
): DistributorConfig | undefined {
  return distributorConfigurations.find(
    (config) => config.value === distributorValue
  )
}

// Function to get the appropriate data processing handler based on distributor config
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
          config.value, // Pass the actual distributor value for mapping
          formatType
        )
      }
    case 'Flying Nun Records Limited':
      return async (filePath, formatType) => {
        return processCsvRows(
          filePath,
          config.headerRowsToSkip as number,
          mapFlyingNunRow,
          config.value, // Pass the actual distributor value for mapping
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
          config.value, // Pass the actual distributor value for mapping
          formatType
        )
      }
    case 'Collective (LP)':
    case 'Collective (CD)':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found for Collective')
        // Pass the specific Collective distributor value to the map function
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          (row) => mapCollectiveRow(row, config.value), // Pass config.value as distributor to mapCollectiveRow
          config.value, // Pass the actual distributor value for mapping
          formatType
        )
      }
    case 'Rhythmethod_Group_Combined_LP':
    case 'Rhythmethod_Group_Combined_CD':
      // This handler is already a full processing pipeline for the combined file
      return handleRhythmethodGroupUpload
    default:
      throw new Error(
        `No specific data handler found for distributor: ${config.value}`
      )
  }
}

// Export the full configurations list, useful for frontend dropdowns
export { distributorConfigurations }
