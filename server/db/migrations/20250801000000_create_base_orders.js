export async function up(knex) {
  // 1. THE PARENT: Orders Table
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary()

    // 🎯 The Fix: Adding the missing name column
    table.string('name').notNullable()

    table.string('distributor').notNullable()
    table.string('status').defaultTo('active')
    table.float('budget_limit').defaultTo(0)
    table.string('wealth_at_creation').defaultTo('ok')

    table.integer('pct_customer').defaultTo(0)
    table.integer('pct_classics').defaultTo(0)
    table.integer('pct_risky').defaultTo(0)

    // 🎯 Tracking: This links back to the staff member who started the order
    table
      .integer('created_by_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')

    table.timestamps(true, true)
  })

  // 2. THE CHILD: Order Items Table
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

    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')

    table.integer('quantity').defaultTo(1)
    table.decimal('ams_price', 10, 2).nullable()
    table.boolean('order_from_ams_flag').defaultTo(false)

    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('order_items')
  await knex.schema.dropTableIfExists('orders')
}
