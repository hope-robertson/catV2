export async function up(knex) {
  // 1. ADD AMS COMPARISON TO CATALOGUE
  await knex.schema.alterTable('master_catalogue', (table) => {
    table.float('ams_wholesale_usd').nullable()
    table.timestamp('ams_last_checked').nullable()
  })

  // 2. CREATE VENDORS TABLE
  await knex.schema.createTable('vendors', (table) => {
    table.increments('id').primary()
    table.string('name').notNullable() 
    table.integer('staff_id').unsigned().references('id').inTable('staff').onDelete('SET NULL')
    table.boolean('is_verified_investor').defaultTo(false)
    table.timestamps(true, true)
  })

  // 3. ADD SURVEY & ROSTER FIELDS
  await knex.schema.alterTable('staff', (table) => {
    table.text('specialist_genres').nullable()
    table.timestamp('last_order_participation_at').nullable()
  })

  await knex.schema.alterTable('customers', (table) => {
    table.text('preferred_genres').nullable()
    table.integer('loyalty_points').defaultTo(0)
  })

  // 4. CREATE ROSTER/AVAILABILITY TABLE
  await knex.schema.createTable('staff_availability', (table) => {
    table.increments('id').primary()
    table.integer('staff_id').unsigned().references('id').inTable('staff').onDelete('CASCADE')
    table.date('start_date').notNullable()
    table.date('end_date').notNullable()
    table.string('reason').nullable() 
    table.timestamps(true, true)
  })

  // 5. REFACTOR ORDER ITEMS (Adding logic for pricing and linking)
  await knex.schema.alterTable('order_items', (table) => {
    table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('SET NULL')
    table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL')
    table.integer('picked_by_staff_id').unsigned().references('id').inTable('staff').onDelete('SET NULL')
    table.decimal('manual_price_override', 10, 2).nullable()
  })
}

export async function down(knex) {
  // 1. REVERSE ORDER ITEMS (Drop FKs first, then columns)
  await knex.schema.alterTable('order_items', (table) => {
    table.dropColumn('vendor_id')
    table.dropColumn('customer_id')
    table.dropColumn('picked_by_staff_id')
    table.dropColumn('manual_price_override')
  })

  // 2. DROP TABLES (Drop dependent tables before parents)
  await knex.schema.dropTableIfExists('staff_availability')
  await knex.schema.dropTableIfExists('vendors')

  // 3. REVERSE STAFF & CUSTOMER UPDATES
  await knex.schema.alterTable('staff', (table) => {
    table.dropColumn('specialist_genres')
    table.dropColumn('last_order_participation_at')
  })

  await knex.schema.alterTable('customers', (table) => {
    table.dropColumn('preferred_genres')
    table.dropColumn('loyalty_points')
  })

  // 4. REVERSE CATALOGUE UPDATES
  await knex.schema.alterTable('master_catalogue', (table) => {
    table.dropColumn('ams_wholesale_usd')
    table.dropColumn('ams_last_checked')
  })
}