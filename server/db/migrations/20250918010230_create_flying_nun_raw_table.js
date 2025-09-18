/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('flying_nun_records_limited_raw', (table) => {
    table.increments('id').primary()
    table.text('Barcode').nullable()
    table.text('Code').nullable()
    table.text('Artist').nullable()
    table.text('Title').nullable()
    table.text('Format').nullable()
    table.text('Price Excl GST').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('flying_nun_records_limited_raw')
}
