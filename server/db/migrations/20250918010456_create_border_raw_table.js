/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('border_music_raw', (table) => {
    table.increments('id').primary()
    table.text('Artist').nullable()
    table.text('Title').nullable()
    table.text('Code').nullable()
    table.text('Barcode').nullable()
    table.text('Format').nullable()
    table.text('Price').nullable()
    table.text('NZ?').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('border_music_raw')
}
