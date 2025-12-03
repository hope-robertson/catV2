// 20251202050000_standardise_all_raw_tables.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // List all raw tables that need to be standardized
  const rawTables = [
    'border_music_raw',
    'rhythmethod_group_combined_raw',
    'flying_nun_records_limited_raw',
    'southbound_instock_raw',
    'collective_lp_raw',
    'collective_cd_raw',
  ]

  console.log('Starting standardization of raw tables...')

  for (const tableName of rawTables) {
    if (await knex.schema.hasTable(tableName)) {
      console.log(`Standardizing columns in table: ${tableName}`)

      // Use alterTable to add any missing columns.
      await knex.schema.alterTable(tableName, async (table) => {
        // --- Add all missing CatalogueRow fields ---
        if (!(await knex.schema.hasColumn(tableName, 'artist')))
          table.string('artist').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'title')))
          table.string('title').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'label')))
          table.string('label').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'format')))
          table.string('format').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'released')))
          table.string('released').nullable()
        // FIX: Ensure 'description' exists for the aggregation script
        if (!(await knex.schema.hasColumn(tableName, 'description')))
          table.text('description').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'barcode')))
          table.string('barcode').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'catalogue_number')))
          table.string('catalogue_number').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'price')))
          table.float('price').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'is_nz_music')))
          table.boolean('is_nz_music').defaultTo(false)
        if (!(await knex.schema.hasColumn(tableName, 'bin_location')))
          table.string('bin_location').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'item_code')))
          table.string('item_code').nullable()
        if (
          !(await knex.schema.hasColumn(tableName, 'unit_sale_price_excl_gst'))
        )
          table.float('unit_sale_price_excl_gst').nullable()
        if (!(await knex.schema.hasColumn(tableName, 'stock_on_hand')))
          table.integer('stock_on_hand').nullable()

        // Distributor and Timestamp fields (ensure they exist)
        if (!(await knex.schema.hasColumn(tableName, 'distributor')))
          table.string('distributor').notNullable()
        if (!(await knex.schema.hasColumn(tableName, 'imported_at')))
          table.timestamp('imported_at').defaultTo(knex.fn.now())
      })
    } else {
      console.log(
        `Table ${tableName} does not exist. Skipping standardization.`
      )
    }
  }

  console.log('All necessary raw tables standardized successfully.')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // No need to undo column additions, but required by knex.
  console.log('Rollback of raw table standardization skipped.')
}
