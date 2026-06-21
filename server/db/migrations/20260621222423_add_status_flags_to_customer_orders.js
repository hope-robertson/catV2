/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable('customer_orders', (table) => {
    // 🎯 Spreadsheet Status Mapping
    table.boolean('is_texted').defaultTo(false)
    table.boolean('is_confirmed').defaultTo(false)
    table.boolean('is_ordered').defaultTo(false)
    table.boolean('is_contacted').defaultTo(false)
    table.boolean('is_picked_up').defaultTo(false)
    table.boolean('is_backburner').defaultTo(false)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('customer_orders', (table) => {
    table.dropColumn('is_texted')
    table.dropColumn('is_confirmed')
    table.dropColumn('is_ordered')
    table.dropColumn('is_contacted')
    table.dropColumn('is_picked_up')
    table.dropColumn('is_backburner')
  })
}
