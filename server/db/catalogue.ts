import knex from './connection.js'
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js'
// 🎯 Import the Source of Truth for table names
import { DISTRIBUTOR_CONFIGS } from '../utils/distributorConfigs.js'

// 🎯 Helper to get the list of active staging tables from config
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
  try {
    await knex(tableName).del()
    if (data.length > 0) {
      // 🎯 Use batchInsert to handle large files safely
      await knex.batchInsert(tableName, data, 500)
      return data.length
    }
    return 0
  } catch (error) {
    throw error
  }
}

export async function consolidateRawDataToMaster(): Promise<number> {
  const trx = await knex.transaction()

  try {
    console.log('[DB] Starting Incremental Consolidation...')
    const rawTableNames = getStagingTables()

    const uniqueItems = new Map<string, any>()
    const collisions: any[] = []
    const itemsToInsert: any[] = []

    // 🎯 Local track to avoid duplicate collisions in the same batch
    const seenCollisions = new Set<string>()

    // Load current master to check for duplicates
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
      if (rawData.length === 0) continue

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

        // 🎯 Collision key to prevent duplicates within the collision list itself
        const collisionKey =
          `${masterItem.barcode}-${masterItem.catalogue_number}`.toLowerCase()

        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, true)
          itemsToInsert.push(masterItem)
        } else if (!seenCollisions.has(collisionKey)) {
          seenCollisions.add(collisionKey)
          collisions.push({
            ...masterItem,
            collision_reason: 'Duplicate of Existing Master or Batch',
            source_table: tableName,
          })
        }
      }
    }

    // 🎯 INSERT NEW ITEMS (Chunked to prevent Union All errors)
    if (itemsToInsert.length > 0) {
      await trx.batchInsert('master_catalogue', itemsToInsert, 100)
    }

    // 🎯 INSERT COLLISIONS (Chunked + Conflict Protection)
    if (collisions.length > 0) {
      const chunkSize = 100
      for (let i = 0; i < collisions.length; i += chunkSize) {
        const chunk = collisions.slice(i, i + chunkSize)

        await trx('master_collisions')
          .insert(chunk)
          .onConflict(['barcode', 'catalogue_number'])
          .ignore()
      }
    }

    await trx.commit()

    const finalCount = await getMasterCount()
    console.log(`--- Consolidation Report ---`)
    console.log(`New Items Added:   ${itemsToInsert.length}`)
    console.log(`Collisions Found:  ${collisions.length}`)
    console.log(`Total Master Size: ${finalCount}`)
    console.log(`----------------------------`)

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

export async function searchMasterCatalogue(
  query: string,
  filter: string,
): Promise<MasterCatalogueRow[]> {
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
  const tables = getStagingTables()
  const results = await Promise.all(
    tables.map(async (t) => {
      const exists = await knex.schema.hasTable(t)
      return exists ? knex(t).select('*') : []
    }),
  )
  return results.flat()
}
