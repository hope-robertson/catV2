// server/db/migrations/20250729064541_create_raw_tables_common_fields.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Assuming 'southbound_instock_raw' is one of the "raw tables" you intend to create
  // You would typically have a separate migration for each distinct raw table schema
  // or a more generic 'raw_catalogue' if all raw imports have the same structure.
  // For now, let's create southbound_instock_raw as it appeared in previous errors.
  const tableName = 'southbound_instock_raw' // Or 'southbound_raw' if that's the intended final name

  const tableExists = await knex.schema.hasTable(tableName)
  if (!tableExists) {
    console.log(`Creating table: ${tableName}`)
    return knex.schema.createTable(tableName, (table) => {
      table.increments('id').primary()
      table.timestamp('imported_at').defaultTo(knex.fn.now())
      table.string('distributor').notNullable() // e.g., 'Southbound', 'Flying Nun'

      // Common fields from CatalogueRow
      table.string('artist').nullable()
      table.string('title').nullable()
      table.string('catalogue_number').nullable()
      table.string('barcode').nullable() // Not unique here, as different distributors might have same barcode for different items
      table.string('format').nullable()
      table.float('price').nullable() // Use float for decimal numbers
      table.string('bin_location').nullable()
      table.string('label').nullable()
      table.text('description').nullable()
      table.string('released').nullable() // Original release date string

      // Fields for Discogs integration
      table.string('discogs_release_date').nullable() // Date from Discogs
      table.text('genres').nullable() // Comma-separated genres
      table.text('styles').nullable() // Comma-separated styles

      // Specific fields for certain distributors (e.g., Flying Nun)
      table.string('item_code').nullable()
      table.float('unit_sale_price_excl_gst').nullable() // For Flying Nun specifically

      table.timestamps(true, true) // Adds `created_at` and `updated_at` columns
    })
  } else {
    console.log(`Table ${tableName} already exists. Skipping creation.`)
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const tableName = 'southbound_instock_raw' // Or 'southbound_raw'
  console.log(`Dropping table: ${tableName}`)
  return knex.schema.dropTableIfExists(tableName)
}
