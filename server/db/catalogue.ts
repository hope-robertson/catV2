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
    console.log('[DB] Starting Incremental Consolidation...')
    const rawTableNames = [
      'flying_nun_records_limited_raw',
      'border_music_raw',
      'collective_lp_raw',
      'collective_cd_raw',
      'southbound_instock_raw',
      'rhythmethod_group_combined_raw',
    ]

    const uniqueItems = new Map<string, any>()
    const collisions: any[] = []

    const existingMaster = await knex('master_catalogue').select(
      'source_distributor',
      'catalogue_number',
      'title',
      'format',
    )
    for (const item of existingMaster) {
      const key =
        `${item.source_distributor}-${item.catalogue_number}-${item.title}-${item.format}`.toLowerCase()
      uniqueItems.set(key, true)
    }

    const itemsToInsert: any[] = []
    let totalScanned = 0

    for (const tableName of rawTableNames) {
      const exists = await knex.schema.hasTable(tableName)
      if (!exists) continue

      const rawData = await knex(tableName).select('*')
      if (rawData.length === 0) continue

      totalScanned += rawData.length

      for (const item of rawData) {
        const masterItem = {
          artist: item.artist,
          title: item.title,
          barcode: item.barcode,
          catalogue_number: item.catalogue_number,
          format: item.format,
          price: item.price,
          is_nz_music: !!item.is_nz_music,
          label: item.label,
          source_distributor: item.distributor,
          last_imported_at: new Date(),
        }

        const key =
          `${masterItem.source_distributor}-${masterItem.catalogue_number}-${masterItem.title}-${masterItem.format}`.toLowerCase()

        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, true)
          itemsToInsert.push(masterItem)
        } else {
          collisions.push({
            ...masterItem,
            collision_reason: 'Duplicate of Existing Master or Batch',
            source_table: tableName,
          })
        }
      }
    }

    if (itemsToInsert.length > 0) {
      const chunkSize = 100
      for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
        await knex('master_catalogue').insert(
          itemsToInsert.slice(i, i + chunkSize),
        )
      }
    }

    await knex('master_collisions').del()
    if (collisions.length > 0) {
      const chunkSize = 100
      for (let i = 0; i < collisions.length; i += chunkSize) {
        await knex('master_collisions').insert(
          collisions.slice(i, i + chunkSize),
        )
      }
    }

    const finalCount = await getMasterCount()
    console.log(`--- Consolidation Report ---`)
    console.log(`New Items Added:   ${itemsToInsert.length}`)
    console.log(`Collisions Found:  ${collisions.length}`)
    console.log(`Total Master Size: ${finalCount}`)
    console.log(`----------------------------`)

    return itemsToInsert.length
  } catch (error) {
    console.error('[DB Error] Consolidation failed:', error)
    throw error
  }
}

export async function getMasterCatalogue(limit = 200) {
  return knex('master_catalogue')
    .select(
      'artist',
      'title',
      'label',
      'format',
      'price',
      'source_distributor',
      'barcode',
      'catalogue_number',
    )
    .orderByRaw(
      "CASE WHEN artist = '' OR artist IS NULL THEN 'Various' ELSE artist END ASC",
    )
    .orderBy('title', 'asc')
    .limit(limit)
}

export async function searchMasterCatalogue(
  query: string,
  filter: string,
): Promise<MasterCatalogueRow[]> {
  console.log(`[DB] Searching for: "${query}" with filter: "${filter}"`)

  return knex<MasterCatalogueRow>('master_catalogue')
    .select('*')
    .where((builder) => {
      const term = `%${query}%`
      if (filter === 'artist') {
        builder.where('artist', 'like', term)
      } else if (filter === 'title') {
        builder.where('title', 'like', term)
      } else if (filter === 'barcode') {
        builder.where('barcode', 'like', term)
      } else {
        builder
          .where('artist', 'like', term)
          .orWhere('title', 'like', term)
          .orWhere('barcode', 'like', term)
          .orWhere('catalogue_number', 'like', term)
          .orWhere('label', 'like', term)
      }
    })
    .orderByRaw(
      "CASE WHEN artist = '' OR artist IS NULL THEN 'Various' ELSE artist END ASC",
    )
    .orderBy('title', 'asc')
    .limit(200)
}

export async function clearRawTable(tableName: string): Promise<void> {
  await knex(tableName).del()
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
