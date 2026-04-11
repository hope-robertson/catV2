export async function up(knex) {
  // 1. The Session Table
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary()
    table.string('distributor').notNullable()
    table.decimal('budget_limit', 10, 2).notNullable()
    table.string('wealth_at_creation').defaultTo('ok')
    table.string('status').defaultTo('active') // 'active', 'finalized', 'nuked'
    table
      .integer('created_by_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')
    table.timestamps(true, true)
  })

  // 2. The Relationship Table (The one your pick_items needs!)
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
    table.decimal('price_at_order', 10, 2)
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('order_items')
  await knex.schema.dropTableIfExists('orders')
}
