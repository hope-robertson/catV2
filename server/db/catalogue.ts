import knex from './connection.js'
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js'
import { DISTRIBUTOR_CONFIGS } from '../utils/distributorConfigs.js'

const getStagingTables = () =>
  Object.values(DISTRIBUTOR_CONFIGS).map((c) => c.rawTableName)

export async function getMasterCount(): Promise<number> {
  const result = await knex('master_catalogue').count('id as cnt').first()
  return Number(result?.cnt || 0)
}

export async function importCatalogueData(
  tableName: string,
  data: CatalogueRow[],
): Promise<number> {
  // Clearing the table for a fresh import
  await knex(tableName).del()
  if (data.length > 0) {
    await knex.batchInsert(tableName, data, 500)
    return data.length
  }
  return 0
}

export async function consolidateRawDataToMaster(): Promise<number> {
  const trx = await knex.transaction()

  try {
    console.log('[DB] Starting Consolidation...')
    const rawTableNames = getStagingTables()

    const uniqueItems = new Map<string, any>()
    const collisions: any[] = []
    const itemsToInsert: any[] = []
    const seenCollisions = new Set<string>()

    // 1. Load current master to check for duplicates
    const existingMaster = await trx('master_catalogue').select(
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

    // 2. Process Raw Tables
    for (const tableName of rawTableNames) {
      const exists = await trx.schema.hasTable(tableName)
      if (!exists) continue

      const rawData = await trx(tableName).select('*')

      for (const item of rawData) {
        // 🎯 MATCHES SCHEMA EXACTLY (No extra columns)
        const baseData = {
          artist: item.artist,
          title: item.title,
          barcode: item.barcode,
          catalogue_number: item.catalogue_number,
          format: item.format,
          price: item.price,
          is_nz_music: !!item.is_nz_music,
          label: item.label,
          source_distributor: item.distributor,
        }

        const key =
          `${baseData.source_distributor}-${baseData.catalogue_number}-${baseData.title}-${baseData.format}`.toLowerCase()
        const collisionKey =
          `${baseData.barcode}-${baseData.catalogue_number}`.toLowerCase()

        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, true)
          itemsToInsert.push(baseData) // 🎯 No last_imported_at
        } else if (!seenCollisions.has(collisionKey)) {
          seenCollisions.add(collisionKey)
          collisions.push({
            ...baseData,
            collision_reason: 'Duplicate of Existing Master or Batch',
            source_table: tableName,
          })
        }
      }
    }

    // 3. Insert New Items to Master
    if (itemsToInsert.length > 0) {
      await trx.batchInsert('master_catalogue', itemsToInsert, 100)
    }

    // 4. Update Collisions (Wipe and Refresh)
    await trx('master_collisions').del()
    if (collisions.length > 0) {
      const chunkSize = 50
      for (let i = 0; i < collisions.length; i += chunkSize) {
        await trx('master_collisions').insert(
          collisions.slice(i, i + chunkSize),
        )
      }
    }

    await trx.commit()
    return itemsToInsert.length
  } catch (error) {
    await trx.rollback()
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

export async function searchMasterCatalogue(query: string, filter: string) {
  const term = `%${query}%`
  return knex('master_catalogue')
    .select('*')
    .where((builder) => {
      if (filter === 'artist') builder.where('artist', 'like', term)
      else if (filter === 'title') builder.where('title', 'like', term)
      else if (filter === 'barcode') builder.where('barcode', 'like', term)
      else {
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

export async function clearRawTable(tableName: string) {
  await knex(tableName).del()
}

export async function getAllRawData() {
  const tables = getStagingTables()
  const results = await Promise.all(
    tables.map(async (t) => {
      const exists = await knex.schema.hasTable(t)
      return exists ? knex(t).select('*') : []
    }),
  )
  return results.flat()
}
