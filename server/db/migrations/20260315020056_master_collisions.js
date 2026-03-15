/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  console.log('Creating table: master_collisions')
  return knex.schema.createTable('master_collisions', (table) => {
    table.increments('id').primary()

    // Data Fields (Mirroring Master)
    table.string('artist').nullable()
    table.string('title').nullable()
    table.string('label').nullable()
    table.string('format').nullable()
    table.string('barcode').nullable()
    table.string('catalogue_number').nullable()
    table.float('price').nullable()
    table.boolean('is_nz_music').defaultTo(false) // 👈 The missing piece
    table.string('source_distributor').nullable()

    // Audit Metadata
    table.string('collision_reason').nullable()
    table.string('source_table').nullable()
    table.timestamp('collision_detected_at').defaultTo(knex.fn.now())

    table.timestamps(true, true)
  })
}

export async function down(knex) {
  console.log('Dropping table: master_collisions')
  return knex.schema.dropTableIfExists('master_collisions')
}
