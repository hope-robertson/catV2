/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add column to the raw table (if you want to track it at the raw level)
  if (await knex.schema.hasTable('border_music_raw')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.boolean('is_nz_music').defaultTo(false).nullable()
    })
  }

  // Add column to the master catalogue table
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
  if (await knex.schema.hasColumn('border_music_raw', 'is_nz_music')) {
    await knex.schema.alterTable('border_music_raw', (table) => {
      table.dropColumn('is_nz_music')
    })
  }

  if (await knex.schema.hasColumn('master_catalogue', 'is_nz_music')) {
    await knex.schema.alterTable('master_catalogue', (table) => {
      table.dropColumn('is_nz_music')
    })
  }
}
