/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('wishlist_items')
  if (!tableExists) {
    console.log('Creating new table: wishlist_items')
    return knex.schema.createTable('wishlist_items', (table) => {
      table.increments('id').primary()

      // Foreign keys for different media types (only one should be non-null)
      table
        .integer('master_catalogue_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('master_catalogue')
        .onDelete('CASCADE')
      table
        .integer('book_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('books')
        .onDelete('CASCADE')
      table
        .integer('comic_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('comics')
        .onDelete('CASCADE')

      // Common fields for all wishlist items
      table
        .integer('staff_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('staff')
        .onDelete('CASCADE')
      table
        .integer('customer_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')

      table.string('notes').nullable()
      table.timestamps(true, true)
    })
  } else {
    console.log('Table wishlist_items already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('wishlist_items')
  console.log('Dropped table: wishlist_items')
}
