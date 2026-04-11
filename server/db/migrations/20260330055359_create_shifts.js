// server/db/migrations/[timestamp]_create_shifts.js

export async function up(knex) {
  return knex.schema.createTable('shifts', (table) => {
    table.increments('id').primary()
    table.date('date').notNullable()
    table.string('time_slot').notNullable()
    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')
    table.unique(['date', 'time_slot'])
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('shifts')
}
