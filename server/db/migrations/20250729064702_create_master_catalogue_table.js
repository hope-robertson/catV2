// 20250729064702_create_master_catalogue_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const masterCatalogueExists = await knex.schema.hasTable('master_catalogue')
  if (!masterCatalogueExists) {
    console.log('Creating new table: master_catalogue')
    return knex.schema.createTable('master_catalogue', (table) => {
      table.increments('id').primary()

      table.string('artist').nullable()
      table.string('title').nullable()
      table.string('label').nullable()
      table.string('format').nullable()
      table.string('released').nullable()
      table.text('description').nullable()

      // Barcode is no longer unique on its own to allow for multiple distributors
      table.string('barcode').nullable()
      table.string('catalogue_number').nullable()
      table.float('price').nullable()
      table.string('bin_location').nullable()
      table.string('item_code').nullable()
      table.float('unit_sale_price_excl_gst').nullable()

      table.string('source_distributor').notNullable()
      table.timestamp('last_imported_at').defaultTo(knex.fn.now())

      table.integer('discogs_release_id').unique().nullable()
      table.integer('discogs_master_id').nullable()
      table.string('discogs_release_date').nullable()
      table.text('genres').nullable()
      table.text('styles').nullable()
      table.text('image_url').nullable()
      table.json('tracklist').nullable()

      // Staff curation fields
      table.integer('popularity_rating').nullable()
      table.text('staff_blurb').nullable()

      table.timestamps(true, true)

      table.unique([
        'catalogue_number',
        'source_distributor',
        'title',
        'format',
      ])
    })
  } else {
    console.log('Table master_catalogue already exists. Skipping creation.')
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('master_catalogue')
  console.log('Dropped table: master_catalogue')
}
