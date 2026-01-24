console.log('--- Migration file is loading ---')

export async function up(knex) {
  console.log('--- Adding rating to master_catalogue ---')
  return knex.schema.table('master_catalogue', (table) => {
    table.integer('rating').defaultTo(0)
  })
}

export async function down(knex) {
  console.log('--- Removing rating from master_catalogue ---')
  return knex.schema.table('master_catalogue', (table) => {
    table.dropColumn('rating')
  })
}
