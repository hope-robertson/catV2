export async function up(knex) {
  return knex.schema.createTable('wishlist_items', (table) => {
    table.increments('id').primary()

    // Foreign keys for different media types
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

    // Ownership
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

    // 🎯 NEW: New Release Intel
    table.date('release_date').nullable()
    table.string('distributor_name').nullable() // Which distro sent the alert?

    table.string('notes').nullable()
    table.timestamps(true, true)
  })
}
