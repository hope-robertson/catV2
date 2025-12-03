// 20250906083944_create_order_pick_items_table.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('order_pick_items')
  if (!tableExists) {
    console.log('Creating new table: order_pick_items')
    return knex.schema.createTable('order_pick_items', (table) => {
      table.increments('id').primary()
      table
        .integer('order_item_id')
        .unsigned()
        .references('id')
        .inTable('order_items')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('master_catalogue_id')
        .unsigned()
        .references('id')
        .inTable('master_catalogue')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('quantity').notNullable().defaultTo(1)
      table.timestamps(true, true)
    })
  } else {
    console.log('Table order_pick_items already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('order_pick_items')
  console.log('Dropped table: order_pick_items')
}
