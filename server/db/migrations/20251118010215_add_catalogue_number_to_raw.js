// 20251118010215_add_catalogue_number_to_raw.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add catalogue_number column to the raw table
  // DEACTIVATED: This is now handled in the initial create_border_music_raw_table migration
  /*
  if (await knex.schema.hasTable('border_music_raw')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      // Add the catalogue_number column that the map is trying to insert
      table.text('catalogue_number').nullable()
    })
  }
  */
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // ⛔ DEACTIVATED: We only drop the column if we added it in the up function
  /*
  if (await knex.schema.hasColumn('border_music_raw', 'catalogue_number')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.dropColumn('catalogue_number')
    })
  }
  */
}