export async function up(knex) {
  return knex.schema.createTable('store_settings', (table) => {
    table.string('key').primary() // e.g., 'wealth_level'
    table.string('value').notNullable() // e.g., 'ok'
    table.string('updated_by_auth_id').nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('store_settings')
}
