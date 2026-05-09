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

    for (const tableName of rawTableNames) {
      const exists = await trx.schema.hasTable(tableName)
      if (!exists) continue
      const rawData = await trx(tableName).select('*')
      for (const item of rawData) {
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
          itemsToInsert.push(baseData)
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

    if (itemsToInsert.length > 0) {
      await trx.batchInsert('master_catalogue', itemsToInsert, 100)
    }

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

/**
 * 🎯 SMART SEARCH & SORT
 * Handles searching all fields, filtering by distributor, and custom sorting.
 */
export async function searchMasterCatalogue(
  query: string,
  distributor: string = 'All',
  sort: string = 'artist',
) {
  const term = `%${query}%`
  let queryBuilder = knex<MasterCatalogueRow>('master_catalogue').select('*')

  // 1. Smart Search (checks all text fields)
  if (query) {
    queryBuilder = queryBuilder.where((builder) => {
      builder
        .where('artist', 'like', term)
        .orWhere('title', 'like', term)
        .orWhere('barcode', 'like', term)
        .orWhere('catalogue_number', 'like', term)
        .orWhere('label', 'like', term)
    })
  }

  // 2. Distributor Filter
  if (distributor && distributor !== 'All') {
    queryBuilder = queryBuilder.andWhere('source_distributor', distributor)
  }

  // 3. Dynamic Sorting
  if (sort === 'high') {
    queryBuilder = queryBuilder.orderBy('price', 'desc')
  } else if (sort === 'low') {
    queryBuilder = queryBuilder.orderBy('price', 'asc')
  } else {
    // Default Alphabetical
    queryBuilder = queryBuilder
      .orderByRaw(
        "CASE WHEN artist = '' OR artist IS NULL THEN 'Various' ELSE artist END ASC",
      )
      .orderBy('title', 'asc')
  }

  return queryBuilder.limit(200)
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
