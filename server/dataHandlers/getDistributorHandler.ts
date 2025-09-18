// server/dataHandlers/getDistributorHandler.ts

import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
import { handleRhythmethodGroupUpload } from './distributorHandlers/rhythmethodGroupHandler.js'

// Centralized configuration for all distributors
const distributorConfigurations: DistributorConfig[] = [
  {
    name: 'Border Music',
    value: 'Border Music',
    rawTableName: 'border_music_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 3,
  },
  {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    rawTableName: 'flying_nun_records_limited_raw',
    fileType: 'csv',
    accept: '.csv',
    headerRowsToSkip: 4,
    requiresFormatFilter: true,
  },
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
  {
    name: 'Rhythmethod Group (Combined Excel - LPs)',
    value: 'Rhythmethod_Group_Combined_LP',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2,
  },
  {
    name: 'Rhythmethod Group (Combined Excel - CDs)',
    value: 'Rhythmethod_Group_Combined_CD',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 2,
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
          formatType
        )
      }
    case 'Flying Nun Records Limited':
      return async (filePath, formatType) => {
        return processCsvRows(
          filePath,
          config.headerRowsToSkip as number,
          mapFlyingNunRow,
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
          formatType
        )
      }
    case 'Collective (LP)':
    case 'Collective (CD)':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found for Collective')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip as number,
          (row) => mapCollectiveRow(row, config.value),
          formatType
        )
      }
    case 'Rhythmethod_Group_Combined_LP':
    case 'Rhythmethod_Group_Combined_CD':
      return handleRhythmethodGroupUpload
    default:
      throw new Error(
        `No specific data handler found for distributor: ${config.value}`
      )
  }
}

// Export the full configurations list, useful for frontend dropdowns
export { distributorConfigurations }
