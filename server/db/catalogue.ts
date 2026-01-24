// server/db/catalogue.ts

import knex from './connection.js' // Ensure this path is correct for your Knex connection
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js' // Import interfaces from shared types file

/**
 * Inserts catalogue data into the specified raw table.
 */
export async function importCatalogueData(
  tableName: string,
  data: CatalogueRow[],
): Promise<number> {
  try {
    console.log(`Clearing existing data from table: ${tableName}`)
    await knex(tableName).del()

    if (data.length > 0) {
      const BATCH_SIZE = 500
      await knex.batchInsert(tableName, data, BATCH_SIZE)

      console.log(
        `Successfully inserted ${data.length} records into ${tableName} using batch insert.`,
      )
      return data.length
    } else {
      console.log(`No data to insert into ${tableName}.`)
      return 0
    }
  } catch (error) {
    console.error(`Error inserting data into ${tableName}:`, error)
    throw error
  }
}

/**
 * Consolidates data from all raw distributor tables into the master_catalogue table.
 */
export async function consolidateRawDataToMaster(): Promise<number> {
  try {
    console.log('Consolidating raw data into master_catalogue...')

    await knex('master_catalogue').del()

    const rawTableNames = [
      'flying_nun_records_limited_raw',
      'border_music_raw',
      'collective_lp_raw',
      'collective_cd_raw',
      'southbound_instock_raw',
      'rhythmethod_group_combined_raw',
    ]

    let totalInserted = 0
    const uniqueItems = new Map<string, MasterCatalogueRow>()

    for (const tableName of rawTableNames) {
      const rawData = await knex(tableName).select('*')
      for (const item of rawData) {
        const masterItem: MasterCatalogueRow = {
          imported_at: new Date(item.imported_at),
          distributor: item.distributor,
          artist: item.artist,
          title: item.title,
          label: item.label,
          format: item.format,
          released: item.released,
          description: item.description,
          barcode: item.barcode,
          catalogue_number: item.catalogue_number,
          price: item.price || item.unit_sale_price_excl_gst,
          bin_location: item.bin_location,
          item_code: item.item_code,
          unit_sale_price_excl_gst: item.unit_sale_price_excl_gst,
          is_nz_music: item.is_nz_music,
          source_distributor: item.distributor,
          last_imported_at: new Date(),
          discogs_release_id: null,
          discogs_master_id: null,
          discogs_release_date: null,
          genres: null,
          styles: null,
          image_url: null,
          tracklist: null,
          id: 0,
          // If you updated your MasterCatalogueRow type to include 'rating',
          // you might need to initialize it here (e.g., rating: 0),
          // otherwise the database default (0) will handle it on insert.
        }

        const key =
          masterItem.barcode ||
          `${masterItem.artist}-${masterItem.title}-${masterItem.format}`
        if (key && !uniqueItems.has(key)) {
          uniqueItems.set(key, masterItem)
        }
      }
    }

    const itemsToInsert = Array.from(uniqueItems.values())
    if (itemsToInsert.length > 0) {
      await knex.batchInsert('master_catalogue', itemsToInsert, 500)
      totalInserted = itemsToInsert.length
    }

    console.log(
      `Consolidated ${totalInserted} unique records into master_catalogue.`,
    )
    return totalInserted
  } catch (error) {
    console.error('Error consolidating raw data to master catalogue:', error)
    throw error
  }
}

export async function getAllMasterCatalogue(
  distributor?: string,
  format?: string,
): Promise<MasterCatalogueRow[]> {
  try {
    let query = knex<MasterCatalogueRow>('master_catalogue').select('*')

    if (distributor && distributor !== 'All') {
      query = query.where('source_distributor', distributor)
    }

    if (format && format !== 'All') {
      query = query.where('format', 'ilike', `%${format}%`)
    }

    return await query
  } catch (error) {
    console.error('Error fetching all master catalogue entries:', error)
    throw error
  }
}

export async function getAllSouthboundCatalogue(): Promise<CatalogueRow[]> {
  try {
    return await knex<CatalogueRow>('southbound_instock_raw').select('*')
  } catch (error) {
    console.error('Error fetching Southbound catalogue entries:', error)
    throw error
  }
}

// ------------------------------------------------------------------
// ⭐ NEW FUNCTIONS ADDED BELOW ⭐
// ------------------------------------------------------------------

/**
 * Searches the master_catalogue table with weighted relevance.
 * Exact matches appear first, followed by "starts with", then general partial matches.
 */
export async function searchMasterCatalogue(
  query: string,
  filter: string,
): Promise<MasterCatalogueRow[]> {
  try {
    return await knex<MasterCatalogueRow>('master_catalogue')
      .select('*')
      // Weighted Relevance Logic using CASE statement
      .select(
        knex.raw(
          `CASE 
            WHEN artist = ? THEN 1
            WHEN title = ? THEN 2
            WHEN artist LIKE ? THEN 3
            ELSE 4
          END AS relevance`,
          [query, query, `${query}%`],
        ),
      )
      .where((builder) => {
        if (filter === 'artist') {
          builder.where('artist', 'like', `%${query}%`)
        } else if (filter === 'title') {
          builder.where('title', 'like', `%${query}%`)
        } else {
          // Default "All" search: checks artist, title, AND barcode
          builder
            .where('artist', 'like', `%${query}%`)
            .orWhere('title', 'like', `%${query}%`)
            .orWhere('barcode', 'like', `%${query}%`)
        }
      })
      .orderBy('relevance', 'asc')
      .orderBy('artist', 'asc')
  } catch (error) {
    console.error('Error searching master catalogue:', error)
    throw error
  }
}

/**
 * Updates the rating (0-3) for a specific item in the master catalogue.
 */
export async function updateRecordRating(
  id: number,
  rating: number,
): Promise<number> {
  try {
    return await knex('master_catalogue').where('id', id).update({ rating })
  } catch (error) {
    console.error(`Error updating rating for record ID ${id}:`, error)
    throw error
  }
}
