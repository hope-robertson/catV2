// 20251118004131_add_is_nz_music_column.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add column to the raw table (if you want to track it at the raw level)
  // commenting this out because the column is now included in the
  // 'create_border_music_raw_table' migration.
  /*
  if (await knex.schema.hasTable('border_music_raw')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.boolean('is_nz_music').defaultTo(false).nullable()
    })
  }
  */

  // Add column to the master catalogue table (KEEP THIS - you still need it here!)
  if (await knex.schema.hasTable('master_catalogue')) {
    await knex.schema.alterTable('master_catalogue', (table) => {
      table.boolean('is_nz_music').defaultTo(false).nullable()
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Comment out or remove the drop logic for the raw table as well
  /*
  if (await knex.schema.hasColumn('border_music_raw', 'is_nz_music')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.dropColumn('is_nz_music')
    })
  }
  */

  if (await knex.schema.hasColumn('master_catalogue', 'is_nz_music')) {
    await knex.schema.alterTable('master_catalogue', (table) => {
      table.dropColumn('is_nz_music')
    })
  }
}
