export async function up(knex) {
  return knex.schema.createTable('duty_rotations', (table) => {
    table.increments('id').primary()
    table.string('duty_type').notNullable() // 'rostering' or 'ordering'
    table
      .integer('current_staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('SET NULL')
    table.string('frequency').defaultTo('weekly') // 'weekly', 'fortnightly', 'monthly'
    table.date('last_cycle_date')

    // This stores the "Fair Queue" as a stringified array [1, 5, 12, 3]
    table.json('queue_order').nullable()

    table.timestamps(true, true)
  })
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('duty_rotations')
}
