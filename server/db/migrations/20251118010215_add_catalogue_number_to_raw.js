/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add catalogue_number column to the raw table
  if (await knex.schema.hasTable('border_music_raw')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      // Add the catalogue_number column that the map is trying to insert
      table.text('catalogue_number').nullable()
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  if (await knex.schema.hasColumn('border_music_raw', 'catalogue_number')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.dropColumn('catalogue_number')
    })
  }
}
