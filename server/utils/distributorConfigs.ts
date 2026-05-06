import { DistributorConfig } from '../types/catalogue.js'

/**
 * Master Distributor Configuration
 * Maps technical file-import settings to procurement & pricing logic.
 * Values derived from the Record Order Calculator spreadsheet.
 */
export const DISTRIBUTOR_CONFIGS: Record<string, DistributorConfig> = {
  COLLECTIVE: {
    name: 'Collective (LP)',
    value: 'COLLECTIVE',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_collective',
    headerRowsToSkip: 9, // Skips the spreadsheet header metadata
    requiresFormatFilter: true,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 4.26,
  },
  SOUTHBOUND: {
    name: 'Southbound',
    value: 'SOUTHBOUND',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_southbound',
    headerRowsToSkip: 9,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 1.35,
  },
  BORDER: {
    name: 'Border Music',
    value: 'BORDER',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'raw_border',
    headerRowsToSkip: 11, // Increased to account for the metadata block
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 2.3,
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
    defaultFreightPerItem: 8.0, // Estimated baseline
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
    defaultFreightPerItem: 15.0, // Estimated higher due to poor margins
  },
}

/**
 * Helper to get config by value/key
 */
export const getDistributorConfig = (
  value: string,
): DistributorConfig | undefined => {
  return DISTRIBUTOR_CONFIGS[value.toUpperCase()]
}
