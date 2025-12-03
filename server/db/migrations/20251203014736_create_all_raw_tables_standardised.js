/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  
  const createTable = async (tableName) => {
    // This function creates the raw table with all standard CatalogueRow fields
    
    await knex.schema.createTable(tableName, (table) => {
      table.increments('id').primary()
      
      // Standard CatalogueRow Fields (Includes all fields required for future aggregation)
      table.string('artist').nullable()
      table.string('title').nullable()
      table.string('label').nullable()
      table.string('format').nullable()
      table.string('released').nullable()
      table.text('description').nullable() // CRITICAL FIX: Guaranteed to exist
      table.string('barcode').nullable()
      table.string('catalogue_number').nullable()
      table.float('price').nullable()
      table.boolean('is_nz_music').defaultTo(false)
      table.string('bin_location').nullable()
      table.string('item_code').nullable()
      table.float('unit_sale_price_excl_gst').nullable()
      table.integer('stock_on_hand').nullable() // CRITICAL FIX: Guaranteed to exist
      
      // Data Tracking Fields
      table.string('distributor').notNullable() // CRITICAL FIX: Guaranteed to exist
      table.timestamp('imported_at').defaultTo(knex.fn.now())
    })
    console.log(`Table ${tableName} created with full standardized schema.`)
  }

  // Create all raw tables (Collective and Rhythmethod consolidated)
  await createTable('border_music_raw')
  await createTable('rhythmethod_group_combined_raw')
  await createTable('flying_nun_records_limited_raw')
  await createTable('southbound_instock_raw')
  await createTable('collective_lp_raw')
  await createTable('collective_cd_raw')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('border_music_raw')
  await knex.schema.dropTableIfExists('rhythmethod_group_combined_raw')
  await knex.schema.dropTableIfExists('flying_nun_records_limited_raw')
  await knex.schema.dropTableIfExists('southbound_instock_raw')
  await knex.schema.dropTableIfExists('collective_lp_raw')
  await knex.schema.dropTableIfExists('collective_cd_raw')
}