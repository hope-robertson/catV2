// server/utils/distributorConfigs.ts

import { DistributorConfig } from '../types/catalogue.js'

export const DISTRIBUTOR_CONFIGS: Record<string, DistributorConfig> = {
  COLLECTIVE: {
    name: 'Collective (LP)',
    value: 'COLLECTIVE',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_collective',
    headerRowsToSkip: 9,
    requiresFormatFilter: true,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 4.26,
  },

  RHYTHMETHOD: {
    name: 'Rhythmethod',
    value: 'RHYTHMETHOD',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_rhythmethod',
    headerRowsToSkip: 9,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 4.52,
  },
  FLYING_NUN: {
    name: 'Flying Nun Records Limited',
    value: 'FLYING_NUN',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_flying_nun',
    headerRowsToSkip: 9,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 1.12,
  },
  AMS: {
    name: 'AMS',
    value: 'AMS',
    fileType: 'csv',
    accept: '.csv',
    rawTableName: 'raw_ams',
    headerRowsToSkip: 0,
    origin: 'import',
    currency: 'USD',
    defaultFreightPerItem: 11.94,
  },
  RECORD_CITY: {
    name: 'Record City',
    value: 'RECORD_CITY',
    fileType: 'csv',
    accept: '.csv',
    rawTableName: 'raw_record_city',
    headerRowsToSkip: 0,
    origin: 'import',
    currency: 'JPY',
    defaultFreightPerItem: 8.0,
  },
  JUNO: {
    name: 'Juno',
    value: 'JUNO',
    fileType: 'csv',
    accept: '.csv',
    rawTableName: 'raw_juno',
    headerRowsToSkip: 0,
    origin: 'import',
    currency: 'GBP',
    defaultFreightPerItem: 15.0,
  },
}

export const getDistributorConfig = (
  value: string,
): DistributorConfig | undefined => {
  return DISTRIBUTOR_CONFIGS[value.toUpperCase()]
}
