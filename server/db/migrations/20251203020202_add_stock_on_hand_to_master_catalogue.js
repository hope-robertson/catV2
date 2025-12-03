/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  if (await knex.schema.hasTable('master_catalogue')) {
    if (!(await knex.schema.hasColumn('master_catalogue', 'stock_on_hand'))) {
      console.log('Adding stock_on_hand to master_catalogue...')
      return knex.schema.alterTable('master_catalogue', (table) => {
        table.integer('stock_on_hand').nullable()
      })
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  if (await knex.schema.hasColumn('master_catalogue', 'stock_on_hand')) {
    return knex.schema.alterTable('master_catalogue', (table) => {
      table.dropColumn('stock_on_hand')
    })
  }
}