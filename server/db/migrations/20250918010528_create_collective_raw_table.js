// 20250918010528_create_collective_raw_table.js
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Create the standardized raw table for LP data
  await knex.schema.createTable('collective_lp_raw', (table) => {
    table.increments('id').primary()
    
    // Standardized fields mapped from Collective spreadsheet
    table.text('artist').nullable()         // Maps from ARTIST (Col A)
    table.text('title').nullable()          // Maps from TITLE (Col B)
    table.text('catalogue_number').nullable() // Maps from CAT # (Col C)
    table.text('barcode').nullable()        // Maps from BARCODE (Col D)
    table.text('format').nullable()         // Maps from FORMAT (Col E)
    table.decimal('price', 10, 2).nullable()// Maps from PRICE (Col F)

    // Standardized application fields (defaulted as they are not in the source file)
    table.boolean('is_nz_music').defaultTo(false).nullable()
    table.integer('stock_on_hand').nullable() 
    
    // Required metadata
    table.text('bin_location').nullable()
    table.text('item_code').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })

  // 2. Create the standardized raw table for CD data (identical structure)
  await knex.schema.createTable('collective_cd_raw', (table) => {
    table.increments('id').primary()
    
    // Standardized fields
    table.text('artist').nullable()
    table.text('title').nullable()
    table.text('catalogue_number').nullable()
    table.text('barcode').nullable()
    table.text('format').nullable()
    table.decimal('price', 10, 2).nullable()
    
    // Standardized application fields
    table.boolean('is_nz_music').defaultTo(false).nullable()
    table.integer('stock_on_hand').nullable()

    // Required metadata
    table.text('bin_location').nullable()
    table.text('item_code').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  // Drop both tables in the down function
  await knex.schema.dropTableIfExists('collective_lp_raw')
  await knex.schema.dropTableIfExists('collective_cd_raw')
}