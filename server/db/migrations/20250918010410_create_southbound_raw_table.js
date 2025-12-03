// 20250918010410_create_southbound_raw_table.js 
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('southbound_instock_raw', (table) => {
    table.increments('id').primary()
    
    // Core data (from spreadsheet columns A-I)
    table.text('catalogue_number').nullable() // Cat No
    table.text('description').nullable()      // Description
    table.text('artist').nullable()           // Artist
    table.text('title').nullable()            // Title
    table.decimal('price', 10, 2).nullable()  // Dealer (contains price)
    table.text('format').nullable()           // Format
    table.text('barcode').nullable()          // BarCode
    table.text('label').nullable()            // Label
    table.text('genres').nullable()           // Genre
    
    // Application Metadata (set by code, may be null/false)
    // We add this for schema consistency, but the Southbound mapper will set it to false/null
    table.boolean('is_nz_music').defaultTo(false)
    
    table.text('distributor').notNullable() // Set by code
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('southbound_instock_raw')
}