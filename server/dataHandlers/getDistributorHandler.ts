// server/dataHandlers/getDistributorHandler.ts

import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js' // Corrected CSV import

// Import all specific mapping and handler functions
import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
// ⭐ FIX: Corrected import name to match the exported function name
import { mapRhythmethodGroupRow } from './distributorHandlers/rhythmethodGroupHandler.js'

// Centralized configuration for all distributors
const distributorConfigurations: DistributorConfig[] = [
  // 1. Border Music
  {
    name: 'Border Music',
    value: 'Border Music',
    rawTableName: 'border_music_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 4,
    requiresFormatFilter: false,
  },

  // 2. Flying Nun Records Limited (CSV)
  {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    rawTableName: 'flying_nun_records_limited_raw',
    fileType: 'csv',
    accept: '.csv,text/csv',
    headerRowsToSkip: 4,
    requiresFormatFilter: false,
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
    headerRowsToSkip: 1,
    requiresFormatFilter: true,
  },
  {
    name: 'Collective (CD)',
    value: 'Collective (CD)',
    rawTableName: 'collective_cd_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1,
    requiresFormatFilter: true,
  },

  // 5. Rhythmethod Group - Vinyl Configuration
  {
    name: 'Rhythmethod Group (Vinyl)',
    value: 'Rhythmethod Group (Vinyl)',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2,
    requiresFormatFilter: true,
  },

  // 6. Rhythmethod Group - CD Configuration
  {
    name: 'Rhythmethod Group (CD)',
    value: 'Rhythmethod Group (CD)',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2,
    requiresFormatFilter: true,
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
          config.value,
          formatType
        )
      }

    case 'Flying Nun Records Limited':
      return async (filePath, formatType) => {
        return processCsvRows(
          filePath,
          config.headerRowsToSkip as number,
          mapFlyingNunRow,
          config.value,
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
          config.value,
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
          (row) => mapCollectiveRow(row, config.value),
          config.value,
          formatType
        )
      }

    // ⭐ Rhythmethod Group (Vinyl) and (CD)
    case 'Rhythmethod Group (Vinyl)':
    case 'Rhythmethod Group (CD)':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet)
          throw new Error('Worksheet not found for Rhythmethod Group')

        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          mapRhythmethodGroupRow, // ⭐ FIX: Corrected function call
          config.value, // Pass distributor value
          formatType // Pass the format filter (LP/CD)
        )
      }

    default:
      throw new Error(
        `No specific data handler found for distributor: ${config.value}`
      )
  }
}

// Export the full configurations list, useful for frontend dropdowns
export { distributorConfigurations }
