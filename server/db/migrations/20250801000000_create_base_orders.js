/**
 * UNIFIED ORDERS: The Master Blueprint
 * This combines the tactical sliders (percentages), status tracking,
 * and specific ordering flags into a single source of truth.
 */

export async function up(knex) {
  // 1. THE PARENT: Orders Table (The Session)
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary()
    table.string('distributor').notNullable()
    table.string('status').defaultTo('active') // active, finalized, nuked, draft
    table.float('budget_limit').defaultTo(0)
    table.string('wealth_at_creation').defaultTo('ok')

    // 🎯 TACTICAL SLIDERS (Preserved from Snippet 9)
    table.integer('pct_customer').defaultTo(0)
    table.integer('pct_classics').defaultTo(0)
    table.integer('pct_risky').defaultTo(0)

    // Relationships
    table
      .integer('created_by_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')

    table.timestamps(true, true)
  })

  // 2. THE CHILD: Order Items Table (The Individual Picks)
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary()
    table
      .integer('order_id')
      .unsigned()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')
    table
      .integer('master_catalogue_id')
      .unsigned()
      .references('id')
      .inTable('master_catalogue')

    // 📦 DATA FIELDS (Preserved from Snippet 1)
    table.integer('quantity').defaultTo(1)
    table.decimal('ams_price', 10, 2).nullable() // Wholesale price at time of order
    table.boolean('order_from_ams_flag').defaultTo(false) // Tracking import origin

    table.timestamps(true, true)
  })
}

export async function down(knex) {
  // Drop children first to satisfy foreign key constraints
  await knex.schema.dropTableIfExists('order_items')
  await knex.schema.dropTableIfExists('orders')
}
