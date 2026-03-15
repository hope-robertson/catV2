export async function up(knex) {
  return knex.schema.createTable('sections', (table) => {
    table.increments('id').primary()
    table.string('name').unique().notNullable() // e.g. "SHOEGAZE/DREAMPOP"
    table.string('code').nullable() // e.g. "DRP"
    table.string('parent_category').nullable() // e.g. "ALT"
    table.text('description').nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('sections')
}
