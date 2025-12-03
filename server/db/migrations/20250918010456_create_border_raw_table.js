// 20250918010456_create_border_raw_table.js
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('border_music_raw', (table) => {
    table.increments('id').primary()
    
    // Core Data - Standardized Names
    table.text('artist').nullable()         // Maps from Spreadsheet 'Artist'
    table.text('title').nullable()          // Maps from Spreadsheet 'Title'
    table.text('catalogue_number').nullable() // Maps from Spreadsheet 'Catalogue Number' (Crucial fix!)
    table.text('barcode').nullable()          // Maps from Spreadsheet 'Bar Code'
    table.text('format').nullable()           // Maps from Spreadsheet 'Format'
    table.decimal('price', 10, 2).nullable()  // Maps from Spreadsheet 'Price' (Crucial fix!)
    
    // Distributor-Specific/New Fields
    table.boolean('is_nz_music').defaultTo(false) // Maps from Spreadsheet 'Bin' (Crucial fix!)

    // Application Metadata (required by CatalogueRow interface, set as nulls)
    table.text('label').nullable()
    table.text('released').nullable()
    table.text('discogs_release_date').nullable()
    table.text('genres').nullable()
    table.text('item_code').nullable()
    table.decimal('unit_sale_price_excl_gst', 10, 2).nullable()

    // Housekeeping
    table.text('distributor').notNullable() 
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('border_music_raw')
}