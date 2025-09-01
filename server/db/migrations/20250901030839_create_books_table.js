/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('books')
  if (!tableExists) {
    console.log('Creating new table: books')
    return knex.schema.createTable('books', (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.string('author')
      table.string('publisher')
      table.string('isbn').unique()
      table.string('link_to_publisher')
      table.timestamps(true, true)
    })
  } else {
    console.log('Table books already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('books')
  console.log('Dropped table: books')
}
