/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  console.log('Creating table: master_collisions')
  return knex.schema.createTable('master_collisions', (table) => {
    table.increments('id').primary()

    // Core Data (Mirrors Master)
    table.string('artist').nullable()
    table.string('title').nullable()
    table.string('label').nullable()
    table.string('format').nullable()
    table.string('barcode').nullable()
    table.string('catalogue_number').nullable()
    table.float('price').nullable()
    table.string('source_distributor').nullable()

    // Audit Metadata
    table.string('collision_reason').nullable() // e.g., "Duplicate Cat No + Distributor"
    table.string('source_table').nullable() // e.g., "border_music_raw"
    table.timestamp('collision_detected_at').defaultTo(knex.fn.now())

    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  console.log('Dropping table: master_collisions')
  return knex.schema.dropTableIfExists('master_collisions')
}
