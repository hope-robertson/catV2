/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const tables = ['rhythmethod_group_combined_raw', 'sony_raw', 'warner_raw']
  for (const tableName of tables) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments('id').primary()
      table.text('Code').nullable()
      table.text('Description').nullable()
      table.text('Barcode').nullable()
      table.text('Price').nullable()
      table.text('Available').nullable()
      table.timestamp('imported_at').defaultTo(knex.fn.now())
    })
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('rhythmethod_group_combined_raw')
  await knex.schema.dropTableIfExists('sony_raw')
  await knex.schema.dropTableIfExists('warner_raw')
}
