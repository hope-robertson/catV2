export async function up(knex) {
  // 1. CREATE PROCUREMENT BATCHES
  await knex.schema.createTable('procurement_batches', (table) => {
    table.increments('id').primary()
    table.string('origin_type').notNullable() // 'local' or 'import'
    table.string('distributor_name').notNullable() 
    table.string('status').defaultTo('accumulating') 
    table.decimal('total_usd_value', 10, 2).defaultTo(0)
    table.timestamp('opened_at').defaultTo(knex.fn.now())
    table.timestamp('closed_at').nullable()
    table.timestamps(true, true)
  })

  // 2. RENAME VENDORS TO INVESTORS (If you already ran the previous migration)
  // If you haven't run upgrade_v2_logic yet, just change 'vendors' to 'investors' in that file.
  // If you HAVE run it, we use renameTable:
  const hasVendors = await knex.schema.hasTable('vendors')
  if (hasVendors) {
    await knex.schema.renameTable('vendors', 'investors')
  }

  // 3. UPDATE ORDER ITEMS 
  await knex.schema.alterTable('order_items', (table) => {
    table.integer('procurement_batch_id').unsigned()
      .references('id').inTable('procurement_batches').onDelete('SET NULL')
    
    // Rename the column if it was already created as vendor_id
    // table.renameColumn('vendor_id', 'investor_id') 
  })
}

export async function down(knex) {
  await knex.schema.alterTable('order_items', (table) => {
    table.dropColumn('procurement_batch_id')
  })
  await knex.schema.dropTableIfExists('procurement_batches')
  // Note: Usually we don't rename back in down unless critical
}