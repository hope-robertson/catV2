// server/db/catalogue.ts

import knex from '../db/connection.js' // Ensure this path is correct for your Knex connection
import { CatalogueRow, MasterCatalogueRow } from '../types/catalogue.js' // Import interfaces from shared types file

/**
 * Inserts catalogue data into the specified raw table.
 * ... (importCatalogueData function remains unchanged as the batch insert fix is already applied) ...
 */
export async function importCatalogueData(
  tableName: string,
  data: CatalogueRow[] // Use the CatalogueRow interface for type safety
): Promise<number> {
  try {
    // This is the line that clears the table before inserting
    console.log(`Clearing existing data from table: ${tableName}`)
    await knex(tableName).del()

    // Use Knex's built-in insert method to handle the array of objects
    if (data.length > 0) {
      // ⭐ MODIFIED: Use batchInsert to prevent "too many terms in compound SELECT" SQLite error ⭐
      const BATCH_SIZE = 500

      // knex.batchInsert handles the batching loop for us, splitting the large insert into chunks
      await knex.batchInsert(tableName, data, BATCH_SIZE)

      console.log(
        `Successfully inserted ${data.length} records into ${tableName} using batch insert.`
      )
      // Return the input data length as batchInsert doesn't consistently return inserted count across databases
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
 * ...
 * @returns The number of records inserted into the master_catalogue.
 */
export async function consolidateRawDataToMaster(): Promise<number> {
  try {
    console.log('Consolidating raw data into master_catalogue...')

    // Clear existing data in master_catalogue before re-populating
    await knex('master_catalogue').del()

    const rawTableNames = [
      'flying_nun_records_limited_raw',
      'border_music_raw',
      'collective_lp_raw',
      'collective_cd_raw',
      'southbound_instock_raw',
      'rhythmethod_group_combined_raw',
      // Add other raw table names as they are introduced
    ]

    let totalInserted = 0
    const uniqueItems = new Map<string, MasterCatalogueRow>() // Key: barcode or (artist + title + format)

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

          // ⭐ NEW FIELD: Copy the value from the raw table item to the master item
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
      // Use Knex's batchInsert for efficiency with large datasets
      // Knex will handle creating the batches for you
      await knex.batchInsert('master_catalogue', itemsToInsert, 500)
      totalInserted = itemsToInsert.length
    }

    console.log(
      `Consolidated ${totalInserted} unique records into master_catalogue.`
    )
    return totalInserted
  } catch (error) {
    console.error('Error consolidating raw data to master catalogue:', error)
    throw error
  }
}

/**
 * ... (getAllMasterCatalogue and getAllSouthboundCatalogue functions remain unchanged) ...
 */
export async function getAllMasterCatalogue(
  distributor?: string,
  format?: string
): Promise<MasterCatalogueRow[]> {
  try {
    let query = knex<MasterCatalogueRow>('master_catalogue').select('*')

    if (distributor && distributor !== 'All') {
      // 'All' means no specific distributor filter
      query = query.where('source_distributor', distributor)
    }

    if (format && format !== 'All') {
      // 'All' means no specific format filter
      query = query.where('format', 'ilike', `%${format}%`) // Case-insensitive format match
    }

    return await query
  } catch (error) {
    console.error('Error fetching all master catalogue entries:', error)
    throw error
  }
}

/**
 * Fetches all raw catalogue entries specifically from the 'southbound_instock_raw' table.
 * ...
 * @returns An array of CatalogueRow objects from the southbound_instock_raw table.
 */
export async function getAllSouthboundCatalogue(): Promise<CatalogueRow[]> {
  try {
    // Select all columns from the southbound_instock_raw table
    return await knex<CatalogueRow>('southbound_instock_raw').select('*')
  } catch (error) {
    console.error('Error fetching Southbound catalogue entries:', error)
    throw error
  }
}
