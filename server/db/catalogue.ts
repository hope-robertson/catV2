import knex from './connection.js'
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js'

export async function importCatalogueData(
  tableName: string,
  data: CatalogueRow[],
): Promise<number> {
  try {
    console.log(`[DB] Clearing ${tableName}...`)
    await knex(tableName).del()
    if (data.length > 0) {
      await knex.batchInsert(tableName, data, 500)
      const countCheck = await knex(tableName).count('id as cnt').first()
      console.log(
        `[DB] Success: ${tableName} now contains ${countCheck?.cnt} rows.`,
      )
      return data.length
    }
    return 0
  } catch (error) {
    console.error(`[DB Error] Failed inserting into ${tableName}:`, error)
    throw error
  }
}

export async function consolidateRawDataToMaster(): Promise<number> {
  try {
    console.log('[DB] Starting Consolidation. Clearing Master...')
    await knex('master_catalogue').del()
    const rawTableNames = [
      'flying_nun_records_limited_raw',
      'border_music_raw',
      'collective_lp_raw',
      'collective_cd_raw',
      'southbound_instock_raw',
      'rhythmethod_group_combined_raw',
    ]
    const uniqueItems = new Map<string, any>()

    for (const tableName of rawTableNames) {
      const rawData = await knex(tableName).select('*')
      console.log(
        `[DB] Consolidating ${rawData.length} rows from ${tableName}...`,
      )
      for (const item of rawData) {
        // Manually mapping to avoid "distributor" column error in master table
        const masterItem = {
          artist: item.artist,
          title: item.title,
          barcode: item.barcode,
          catalogue_number: item.catalogue_number,
          format: item.format,
          price: item.price,
          is_nz_music: item.is_nz_music,
          bin_location: item.bin_location,
          label: item.label,
          source_distributor: item.distributor,
          last_imported_at: new Date(),
          rating: 0,
        }
        const key =
          masterItem.barcode ||
          `${masterItem.artist}-${masterItem.title}-${masterItem.format}`
        if (key && !uniqueItems.has(key)) uniqueItems.set(key, masterItem)
      }
    }

    const itemsToInsert = Array.from(uniqueItems.values())
    if (itemsToInsert.length > 0) {
      console.log(
        `[DB] Inserting ${itemsToInsert.length} unique items into Master...`,
      )
      await knex.batchInsert('master_catalogue', itemsToInsert, 500)
    }
    const finalCount = await knex('master_catalogue').count('id as cnt').first()
    console.log(`[DB] Consolidation complete. Master total: ${finalCount?.cnt}`)
    return itemsToInsert.length
  } catch (error) {
    console.error('[DB Error] Consolidation error:', error)
    throw error
  }
}

export async function getAllRawData(): Promise<any[]> {
  const tables = [
    'flying_nun_records_limited_raw',
    'border_music_raw',
    'collective_lp_raw',
    'collective_cd_raw',
    'southbound_instock_raw',
    'rhythmethod_group_combined_raw',
  ]
  const results = await Promise.all(tables.map((t) => knex(t).select('*')))
  return results.flat()
}

export async function insertToMaster(data: any[]): Promise<number> {
  if (data.length === 0) return 0
  await knex.batchInsert('master_catalogue', data, 500)
  return data.length
}

export async function searchMasterCatalogue(
  query: string,
  filter: string,
): Promise<MasterCatalogueRow[]> {
  return knex<MasterCatalogueRow>('master_catalogue')
    .select('*')
    .where((builder) => {
      if (filter === 'artist') builder.where('artist', 'like', `%${query}%`)
      else if (filter === 'title') builder.where('title', 'like', `%${query}%`)
      else
        builder
          .where('artist', 'like', `%${query}%`)
          .orWhere('title', 'like', `%${query}%`)
          .orWhere('barcode', 'like', `%${query}%`)
    })
    .orderBy('artist', 'asc')
}

export async function updateRecordRating(
  id: number,
  rating: number,
): Promise<number> {
  return knex('master_catalogue').where('id', id).update({ rating })
}

export async function clearRawTable(tableName: string): Promise<void> {
  try {
    console.log(`[DB] Explicitly clearing ${tableName}...`)
    await knex(tableName).del()
  } catch (error) {
    console.error(`[DB Error] Error clearing table ${tableName}:`, error)
    throw error
  }
}
