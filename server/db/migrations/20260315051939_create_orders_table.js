export async function up(knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary()
    table.string('distributor').notNullable()
    table.string('status').defaultTo('draft') // draft, pending, sent
    table.float('budget_limit').defaultTo(0)
    table.string('wealth_at_creation').defaultTo('ok') // poor, ok, wealthy

    // Percentages (The sliders you mentioned)
    table.integer('pct_customer').defaultTo(0)
    table.integer('pct_classics').defaultTo(0)
    table.integer('pct_risky').defaultTo(0)

    table.string('created_by_auth_id').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('orders')
}
