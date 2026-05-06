import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

// 🎯 Source of truth
import { DISTRIBUTOR_CONFIGS } from '../utils/distributorConfigs.js'

import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
import { mapRhythmethodGroupRow } from './distributorHandlers/rhythmethodGroupHandler.js'

export function getDistributorConfig(
  distributorValue: string,
): DistributorConfig | undefined {
  // 🎯 FIXED: Normalize to uppercase so "Southbound" matches "SOUTHBOUND"
  const normalizedSearch = distributorValue.toUpperCase()
  return Object.values(DISTRIBUTOR_CONFIGS).find(
    (config) => config.value.toUpperCase() === normalizedSearch,
  )
}

export function getDistributorDataHandler(
  config: DistributorConfig,
): DistributorHandler {
  // 🎯 Use the normalized value from our central config keys
  switch (config.value.toUpperCase()) {
    case 'BORDER':
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

    case 'FLYING_NUN':
      return async (filePath, formatType) => {
        return processCsvRows(
          filePath,
          config.headerRowsToSkip,
          mapFlyingNunRow,
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

    case 'RHYTHMETHOD':
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
