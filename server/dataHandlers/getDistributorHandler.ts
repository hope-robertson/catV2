import { DistributorConfig, DistributorHandler } from '../types/catalogue.js'
import { processExcelRows, getWorksheet } from '../utils/excelHelpers.js'
import { processCsvRows } from '../utils/csvHelpers.js'

// 🎯 IMPORT the central configs instead of defining them here
import { DISTRIBUTOR_CONFIGS } from '../utils/distributorConfigs.js'

import { mapBorderMusicRow } from './distributorHandlers/borderMusicHandler.js'
import { mapCollectiveRow } from './distributorHandlers/collectiveHandler.js'
import { mapFlyingNunRow } from './distributorHandlers/flyingNunHandler.js'
import { mapSouthboundRow } from './distributorHandlers/southboundHandler.js'
import { mapRhythmethodGroupRow } from './distributorHandlers/rhythmethodGroupHandler.js'

// 🎯 This function now looks at the Central Config file
export function getDistributorConfig(
  distributorValue: string,
): DistributorConfig | undefined {
  // Convert map to array to find the match
  return Object.values(DISTRIBUTOR_CONFIGS).find(
    (config) => config.value === distributorValue,
  )
}

export function getDistributorDataHandler(
  config: DistributorConfig,
): DistributorHandler {
  // We use the 'value' from the config to decide which mapper to use
  switch (config.value) {
    case 'BORDER': // 🎯 Updated to match DISTRIBUTOR_CONFIGS keys
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
    case 'SONY': // Assuming Sony/Warner are handled by Rhythmethod logic
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
