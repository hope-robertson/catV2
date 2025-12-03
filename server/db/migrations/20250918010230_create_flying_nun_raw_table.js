// 20250918010230_create_flying_nun_raw_table.js
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('flying_nun_records_limited_raw', (table) => {
    table.increments('id').primary()
    
    // --- Fields from the CSV ---
    table.text('item_code').nullable() // Maps from 'Item Code'
    table.text('description').nullable() // Maps from 'Item Name' (The raw text)
    table.decimal('unit_sale_price_excl_gst', 10, 2).nullable() // Maps from 'Unit Sale Price excl. GST'

    // --- Fields derived from parsing 'description' ---
    table.text('artist').nullable()
    table.text('title').nullable()
    table.text('format').nullable()
    
    // --- Standard CatalogueRow fields (set to null/default as they are not in source) ---
    table.text('barcode').nullable()
    table.text('catalogue_number').nullable() 
    table.decimal('price', 10, 2).nullable() // Cost Price/PPD (Not supplied in this file)
    table.text('bin_location').nullable()
    table.integer('stock_on_hand').nullable()
    table.boolean('is_nz_music').defaultTo(false).nullable() // Set by handler logic
    table.text('label').nullable()
    table.text('released').nullable()
    table.text('genres').nullable()
    
    // Required metadata
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('flying_nun_records_limited_raw')
}