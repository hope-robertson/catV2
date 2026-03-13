import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'
import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
import { mapRhythmethodGroupRow } from './distributorHandlers/rhythmethodGroupHandler.js'

const distributorConfigurations: DistributorConfig[] = [
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
  {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    rawTableName: 'flying_nun_records_limited_raw',
    fileType: 'csv',
    accept: '.csv,text/csv',
    headerRowsToSkip: 4,
    requiresFormatFilter: false,
  },
  {
    name: 'Southbound',
    value: 'Southbound',
    rawTableName: 'southbound_instock_raw',
    fileType: 'xlsx',
    accept:
      '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    headerRowsToSkip: 1,
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
    name: 'Rhythmethod (SOH)',
    value: 'Rhythmethod',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept: '.xlsx',
    headerRowsToSkip: 2,
    requiresFormatFilter: true,
  },
  {
    name: 'Sony Music (SOH)',
    value: 'Sony Music',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept: '.xlsx',
    headerRowsToSkip: 2,
    requiresFormatFilter: true,
  },
  {
    name: 'Warner Music (SOH)',
    value: 'Warner Music',
    rawTableName: 'rhythmethod_group_combined_raw',
    fileType: 'xlsx',
    accept: '.xlsx',
    headerRowsToSkip: 2,
    requiresFormatFilter: true,
  },
]

export function getDistributorConfig(
  distributorValue: string,
): DistributorConfig | undefined {
  return distributorConfigurations.find(
    (config) => config.value === distributorValue,
  )
}

export function getDistributorDataHandler(
  config: DistributorConfig,
): DistributorHandler {
  switch (config.value) {
    case 'Border Music':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip,
          mapBorderMusicRow,
          config.value,
          formatType,
        )
      }

    case 'Flying Nun Records Limited':
      return async (filePath, formatType) => {
        return processCsvRows(
          filePath,
          config.headerRowsToSkip,
          mapFlyingNunRow,
          config.value,
          formatType,
        )
      }

    case 'Southbound':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip,
          mapSouthboundRow,
          config.value,
          formatType,
        )
      }

    case 'Collective (LP)':
    case 'Collective (CD)':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip,
          mapCollectiveRow,
          config.value,
          formatType,
        )
      }

    case 'Rhythmethod':
    case 'Sony Music':
    case 'Warner Music':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
        // Wrap mapper to inject the specific distributor name
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip,
          (row) => mapRhythmethodGroupRow(row, config.value),
          config.value,
          formatType,
        )
      }

    default:
      throw new Error(`No handler found for: ${config.value}`)
  }
}

export { distributorConfigurations }
