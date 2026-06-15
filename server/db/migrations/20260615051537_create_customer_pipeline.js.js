export async function up(knex) {
  // 1. SAFEGUARD: Check/Create Customers Table
  const hasCustomers = await knex.schema.hasTable('customers')
  if (!hasCustomers) {
    console.log('Creating missing customers table...')
    await knex.schema.createTable('customers', (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('phone').notNullable() // Non-negotiable
      table.string('email').nullable()
      // Bringing in the v2 upgrade fields just in case it's a fresh DB
      table.text('preferred_genres').nullable()
      table.integer('loyalty_points').defaultTo(0)
      table.timestamps(true, true)
    })
  } else {
    // If it exists, let's just make absolutely sure it has a phone column
    const hasPhone = await knex.schema.hasColumn('customers', 'phone')
    if (!hasPhone) {
      await knex.schema.alterTable('customers', (table) => {
        table.string('phone').notNullable().defaultTo('000000000')
      })
    }
  }

  // 2. CREATE: Customer Orders (The Docket)
  await knex.schema.createTable('customer_orders', (table) => {
    table.increments('id').primary()

    // Links to Customer
    table
      .integer('customer_id')
      .unsigned()
      .references('id')
      .inTable('customers')
      .onDelete('RESTRICT')
      .notNullable()

    // Links to Clerk (Non-negotiable tracking)
    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('RESTRICT')
      .notNullable()

    table.string('status').defaultTo('pending') // pending -> ordered -> arrived -> fulfilled
    table.text('notes').nullable()

    table.timestamps(true, true)
  })

  // CREATE: Customer Order Items
  await knex.schema.createTable('customer_order_items', (table) => {
    table.increments('id').primary()

    table
      .integer('customer_order_id')
      .unsigned()
      .references('id')
      .inTable('customer_orders')
      .onDelete('CASCADE')
      .notNullable()
    table
      .integer('master_catalogue_id')
      .unsigned()
      .references('id')
      .inTable('master_catalogue')
      .onDelete('RESTRICT')
      .notNullable()

    table.integer('quantity').defaultTo(1)

    // Pricing Logic
    table.decimal('quoted_price', 10, 2).notNullable() // Final NZD retail price quoted to customer
    table.decimal('base_usd_price', 10, 2).nullable() // AMS USD Price (if applicable)
    table.decimal('exchange_rate_used', 10, 4).nullable() // e.g., 0.5737

    // 🎯 THE BRIDGE: Links to the distributor order once you actually buy it from the supplier
    table
      .integer('distributor_order_item_id')
      .unsigned()
      .references('id')
      .inTable('order_items')
      .onDelete('SET NULL')

    table.timestamps(true, true)
  })

  // 4. SEED: Initial Exchange Rate
  // Ensure the frontend doesn't crash trying to fetch a rate that doesn't exist yet
  const hasRate = await knex('store_settings')
    .where('key', 'usd_exchange_rate')
    .first()
  if (!hasRate) {
    await knex('store_settings').insert({
      key: 'usd_exchange_rate',
      value: '0.5737', // Seeded from your spreadsheet example
    })
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('customer_order_items')
  await knex.schema.dropTableIfExists('customer_orders')
  // We leave customers and store_settings alone on rollback
}
