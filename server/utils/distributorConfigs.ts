import { DistributorConfig } from '../types/catalogue.js'

export const DISTRIBUTOR_CONFIGS: Record<string, DistributorConfig> = {
  COLLECTIVE: {
    name: 'Collective (LP)',
    value: 'COLLECTIVE',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'collective_lp_raw',
    headerRowsToSkip: 9,
    requiresFormatFilter: true,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 4.26,
  },
  SOUTHBOUND: {
    name: 'Southbound',
    value: 'Southbound',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'southbound_instock_raw',
    headerRowsToSkip: 2, // 🎯 Skips the metadata + the "Artist/Title" row
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 1.35,
  },
  BORDER: {
    name: 'Border Music',
    value: 'Border Music',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'border_music_raw',
    headerRowsToSkip: 7, // 🎯 Skips the metadata block + the "Artist/Title" row
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 2.3,
  },
  RHYTHMETHOD: {
    name: 'Rhythmethod',
    value: 'Rhythmethod',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'rhythmethod_group_combined_raw',
    headerRowsToSkip: 9,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 4.52,
  },
  FLYING_NUN: {
    name: 'Flying Nun Records Limited',
    value: 'Flying Nun Records Limited',
    fileType: 'xlsx',
    accept: '.xlsx',
    rawTableName: 'flying_nun_records_limited_raw',
    headerRowsToSkip: 9,
    origin: 'local',
    currency: 'NZD',
    defaultFreightPerItem: 1.12,
  },
}

export const getDistributorConfig = (val: string) =>
  DISTRIBUTOR_CONFIGS[val.toUpperCase()]
