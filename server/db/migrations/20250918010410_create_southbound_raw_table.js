/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('southbound_instock_raw', (table) => {
    table.increments('id').primary()
    table.text('catalogue_number').nullable()
    table.text('description').nullable()
    table.text('artist').nullable()
    table.text('title').nullable()
    table.decimal('price', 10, 2).nullable()
    table.text('format').nullable()
    table.text('barcode').nullable()
    table.text('distributor').nullable()
    table.text('label').nullable()
    table.text('released').nullable()
    table.text('bin_location').nullable()
    table.text('item_code').nullable()
    table.decimal('unit_sale_price_excl_gst', 10, 2).nullable()
    table.text('genres').nullable()
    table.text('discogs_release_date').nullable()
    table.timestamp('imported_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex) {
  return knex.schema.dropTable('southbound_instock_raw')
}
