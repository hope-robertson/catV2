/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('customers')
  if (!tableExists) {
    console.log('Creating new table: customers')
    return knex.schema.createTable('customers', (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('phone_number')
      table.string('email').unique()
      table.timestamps(true, true)
    })
  } else {
    console.log('Table customers already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('customers')
  console.log('Dropped table: customers')
}
