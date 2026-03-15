export async function up(knex) {
  return knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary()
    // LINK TO THE ORDER HEADER
    table
      .integer('order_id')
      .unsigned()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')

    table
      .integer('master_catalogue_id')
      .unsigned()
      .references('id')
      .inTable('master_catalogue')
    table.integer('quantity').defaultTo(1)
    table.float('ams_price').nullable()
    table.boolean('order_from_ams_flag').defaultTo(false)
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('order_items')
}
