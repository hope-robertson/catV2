/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const masterCatalogueTableName = 'master_catalogue'

  // 1. Clear the main master_catalogue table before re-importing fresh data
  console.log(`Clearing existing data from ${masterCatalogueTableName}...`)
  await knex(masterCatalogueTableName).del()

  // Define the common columns that map directly from most raw tables
  const directMapColumns = [
    'artist',
    'title',
    'label',
    'format',
    'released',
    'description',
    'barcode',
    'catalogue_number',
    'price',
    'is_nz_music',
    'bin_location',
    'item_code',
    'unit_sale_price_excl_gst',
    'stock_on_hand',
    'imported_at',
  ]

  // --- 2. INSERT: Border Music ---
  console.log('Inserting data from border_music_raw...')
  await knex(masterCatalogueTableName).insert(function () {
    this.select(
      ...directMapColumns,
      knex.raw('distributor as source_distributor')
    ).from('border_music_raw')
  })

  // --- 3. INSERT: Rhythmethod Group Combined ---
  console.log('Inserting data from rhythmethod_group_combined_raw...')
  await knex(masterCatalogueTableName).insert(function () {
    this.select(
      ...directMapColumns,
      knex.raw('distributor as source_distributor')
    ).from('rhythmethod_group_combined_raw')
  })

  // --- 4. INSERT: Collective LP & CD ---
  // The structure is identical for both tables.
  const collectiveBaseMapColumns = [
    'artist',
    'title',
    'format',
    'barcode',
    'catalogue_number',
    'price',
    'is_nz_music',
    'stock_on_hand',
    'unit_sale_price_excl_gst',
    'imported_at',
  ]
  const collectiveMissingColumns = [
    knex.raw('NULL as released'),
    knex.raw('NULL as description'),
    knex.raw('NULL as bin_location'),
    knex.raw('NULL as item_code'),
  ]

  console.log('Inserting data from collective_lp_raw...')
  await knex(masterCatalogueTableName).insert(function () {
    this.select(
      ...collectiveBaseMapColumns,
      ...collectiveMissingColumns,
      knex.raw('label as label'), // Collective handler should set this
      knex.raw('distributor as source_distributor')
    ).from('collective_lp_raw')
  })

  console.log('Inserting data from collective_cd_raw...')
  await knex(masterCatalogueTableName).insert(function () {
    this.select(
      ...collectiveBaseMapColumns,
      ...collectiveMissingColumns,
      knex.raw('label as label'), // Collective handler should set this
      knex.raw('distributor as source_distributor')
    ).from('collective_cd_raw')
  })

  // --- 5. INSERT: Flying Nun Records Limited ---
  console.log('Inserting data from flying_nun_records_limited_raw...')
  await knex(masterCatalogueTableName).insert(function () {
    this.select(
      'artist',
      'title',
      'format',
      'description',
      'item_code',
      'is_nz_music',
      'unit_sale_price_excl_gst',
      'imported_at',
      // Explicitly map/set other required columns
      knex.raw('? as label', ['Flying Nun Records']),
      knex.raw('NULL as released'),
      knex.raw('NULL as barcode'),
      knex.raw('NULL as catalogue_number'),
      knex.raw('NULL as price'),
      knex.raw('NULL as bin_location'),
      knex.raw('NULL as stock_on_hand'),
      knex.raw('distributor as source_distributor')
    ).from('flying_nun_records_limited_raw')
  })

  // Optional: Update last_imported_at timestamp on all new records
  await knex(masterCatalogueTableName).update({
    last_imported_at: knex.fn.now(),
  })

  console.log('Data aggregation complete.')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Clearing the master_catalogue table is a safe action for this rollback.
  return knex('master_catalogue').del()
}
