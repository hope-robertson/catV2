import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

import { DISTRIBUTOR_CONFIGS } from '../utils/distributorConfigs.js'

import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
import { mapRhythmethodGroupRow } from './distributorHandlers/rhythmethodGroupHandler.js'
// 🎯 ADDED: Import your brand new Universal handler
import { mapUniversalRow } from './distributorHandlers/universalHandler.js'

export function getDistributorConfig(
  distributorValue: string,
): DistributorConfig | undefined {
  const normalizedSearch = distributorValue.toUpperCase()
  return Object.values(DISTRIBUTOR_CONFIGS).find(
    (config) =>
      config.value.toUpperCase() === normalizedSearch ||
      config.name.toUpperCase() === normalizedSearch,
  )
}

export function getDistributorDataHandler(
  config: DistributorConfig,
): DistributorHandler {
  const distributorKey = config.value.toUpperCase()

  switch (distributorKey) {
    case 'BORDER':
    case 'BORDER MUSIC':
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

    case 'SOUTHBOUND':
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

    case 'COLLECTIVE':
    case 'COLLECTIVE (LP)':
    case 'COLLECTIVE (CD)':
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

    // 🎯 ADDED: Universal now has its own separate block using mapUniversalRow
    case 'UNIVERSAL':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
        return processExcelRows(
          worksheet,
          config.headerRowsToSkip,
          mapUniversalRow,
          config.value,
          formatType,
        )
      }

    case 'RHYTHMETHOD':
    case 'SONY MUSIC':
    case 'WARNER MUSIC':
    case 'SONY':
    case 'WARNER':
      return async (filePath, formatType) => {
        const worksheet = await getWorksheet(filePath)
        if (!worksheet) throw new Error('Worksheet not found')
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
