/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // Use a single table for the combined upload to streamline the process
  const tables = ['rhythmethod_group_combined_raw'] 
  
  for (const tableName of tables) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments('id').primary()
      // Standardized Column Names
      table.text('catalogue_number').nullable() // Maps from 'Code' (Col 2)
      table.text('description_raw').nullable() // Maps from 'Description' (Col 3) - NEW!
      table.text('barcode').nullable()         // Maps from 'Barcode' (Col 4)
      table.decimal('price', 10, 2).nullable() // Maps from 'PPD' (Col 5)
      table.integer('stock_on_hand').nullable()// Maps from 'SOH' (Col 6) - NEW!

      // Application Metadata (Required for ALL raw tables)
      table.text('distributor_sheet').nullable() // e.g., 'Rhythmethod', 'Sony' (Helpful for filtering)
      table.text('bin_location').nullable()
      table.text('item_code').nullable()
      table.text('label').nullable()
      table.text('genres').nullable()
      table.text('released').nullable()
      table.boolean('is_nz_music').defaultTo(false) // Assuming no NZ flag here

      table.timestamp('imported_at').defaultTo(knex.fn.now())
    })
  }
  
  // Drop the unused tables if they were mistakenly created before
  await knex.schema.dropTableIfExists('sony_raw')
  await knex.schema.dropTableIfExists('warner_raw')
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('rhythmethod_group_combined_raw')
  // We only care about dropping the final combined table
}