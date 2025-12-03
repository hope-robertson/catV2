// 20250901031650_create_comics_table.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tableExists = await knex.schema.hasTable('comics')
  if (!tableExists) {
    console.log('Creating new table: comics')
    return knex.schema.createTable('comics', (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.string('series')
      table.string('volume')
      table.string('artist')
      table.string('publisher')
      table.string('isbn').unique()
      table.timestamps(true, true)
    })
  } else {
    console.log('Table comics already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('comics')
  console.log('Dropped table: comics')
}
