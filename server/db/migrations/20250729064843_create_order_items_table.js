// 20250729064843_create_order_items_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('order_items')
  if (!tableExists) {
    console.log('Creating table: order_items')
    return knex.schema.createTable('order_items', (table) => {
      table.increments('id').primary()
      table
        .integer('master_catalogue_id')
        .unsigned()
        .references('id')
        .inTable('master_catalogue')
        .onDelete('CASCADE')
        .notNullable()

      table.integer('quantity').notNullable().defaultTo(1)
      table.string('ordered_from_distributor').nullable()
      table.float('ams_price').nullable()
      table.boolean('order_from_ams_flag').notNullable().defaultTo(false)

      table.timestamps(true, true)
    })
  } else {
    console.log('Table order_items already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  console.log('Dropping table: order_items')
  return knex.schema.dropTableIfExists('order_items')
}
