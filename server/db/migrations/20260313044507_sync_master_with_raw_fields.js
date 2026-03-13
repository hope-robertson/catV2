/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasNZ = await knex.schema.hasColumn('master_catalogue', 'is_nz_music')
  const hasGenres = await knex.schema.hasColumn('master_catalogue', 'genres')

  return knex.schema.alterTable('master_catalogue', (table) => {
    if (!hasNZ) {
      table.boolean('is_nz_music').defaultTo(false)
    }
    if (!hasGenres) {
      table.string('genres').nullable()
    }
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('master_catalogue', (table) => {
    table.dropColumn('is_nz_music')
    table.dropColumn('genres')
  })
}
