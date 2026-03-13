import knex from './connection.js'
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js'

export async function getMasterCount(): Promise<number> {
  const result = await knex('master_catalogue').count('id as cnt').first()
  return Number(result?.cnt || 0)
}

export async function importCatalogueData(
  tableName: string,
  data: CatalogueRow[],
): Promise<number> {
  try {
    await knex(tableName).del()
    if (data.length > 0) {
      await knex.batchInsert(tableName, data, 500)
      return data.length
    }
    return 0
  } catch (error) {
    throw error
  }
}

export async function consolidateRawDataToMaster(): Promise<number> {
  try {
    // 1. We no longer clear the Master table at the start
    console.log('[DB] Starting Consolidation. Appending to Master...')

    const rawTableNames = [
      'flying_nun_records_limited_raw',
      'border_music_raw',
      'collective_lp_raw',
      'collective_cd_raw',
      'southbound_instock_raw',
      'rhythmethod_group_combined_raw',
    ]

    // We use a Map to handle exact duplicates (same item from same distro)
    const uniqueItems = new Map<string, any>()

    for (const tableName of rawTableNames) {
      const exists = await knex.schema.hasTable(tableName)
      if (!exists) continue

      const rawData = await knex(tableName).select('*')
      if (rawData.length === 0) continue

      console.log(`[DB] Found ${rawData.length} rows in ${tableName}`)

      for (const item of rawData) {
        const masterItem = {
          artist: item.artist,
          title: item.title,
          barcode: item.barcode,
          catalogue_number: item.catalogue_number,
          format: item.format,
          price: item.price,
          is_nz_music: !!item.is_nz_music,
          genres: item.genres,
          bin_location: item.bin_location,
          label: item.label,
          source_distributor: item.distributor,
          last_imported_at: new Date(),
          rating: 0,
        }

        // 2. Composite Key: Keeps the item if the distributor is different
        const key = `${masterItem.source_distributor}-${masterItem.barcode || masterItem.catalogue_number}-${masterItem.format}`

        if (key && !uniqueItems.has(key)) {
          uniqueItems.set(key, masterItem)
        }
      }
    }

    const itemsToInsert = Array.from(uniqueItems.values())
    if (itemsToInsert.length > 0) {
      console.log(`[DB] Syncing ${itemsToInsert.length} items to Master...`)

      // 3. Use onConflict to allow overlapping distributor stock
      // This requires the 'catalogue_number' and 'source_distributor' fields
      await knex('master_catalogue')
        .insert(itemsToInsert)
        .onConflict(['catalogue_number', 'source_distributor'])
        .merge()
    }

    const finalCount = await getMasterCount()
    console.log(`[DB] Consolidation Finished. Master total: ${finalCount}`)

    return itemsToInsert.length
  } catch (error) {
    console.error('[DB Error] Consolidation failed:', error)
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

export async function clearRawTable(tableName: string): Promise<void> {
  await knex(tableName).del()
}
