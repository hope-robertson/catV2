export async function up(knex) {
  return knex.schema.createTable('staff_sections', (table) => {
    table.increments('id').primary()
    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('CASCADE')
    table
      .integer('section_id')
      .unsigned()
      .references('id')
      .inTable('sections')
      .onDelete('CASCADE')
    table.unique(['staff_id', 'section_id'])
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('staff_sections')
}
