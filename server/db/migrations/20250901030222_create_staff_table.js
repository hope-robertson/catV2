// 20250901030222_create_staff_table.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('staff')
  if (!tableExists) {
    console.log('Creating new table: staff')
    return knex.schema.createTable('staff', (table) => {
      table.increments('id').primary()
      table.string('auth_id').unique().notNullable()
      table.string('name').notNullable()
      table.string('email').unique()
      table.string('role').notNullable().defaultTo('clerk')
      table.text('sections').nullable() // New field for staff's assigned sections
      table.timestamps(true, true)
    })
  } else {
    console.log('Table staff already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('staff')
  console.log('Dropped table: staff')
}
