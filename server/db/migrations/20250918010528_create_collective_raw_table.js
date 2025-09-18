/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('collective_lp_raw', (table) => {
    table.increments('id').primary()
    table.text('ARTIST').nullable()
    table.text('Cat No').nullable()
    table.text('Barcode').nullable()
    table.text('FORMAT').nullable()
    table.text('PRICE').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('collective_lp_raw')
}
