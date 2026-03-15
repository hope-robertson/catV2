export async function up(knex) {
  const tableExists = await knex.schema.hasTable('staff')
  if (!tableExists) {
    return knex.schema.createTable('staff', (table) => {
      table.increments('id').primary()
      table.string('auth_id').unique().notNullable()
      table.string('name').notNullable()
      table.string('email').unique()
      table.string('role').notNullable().defaultTo('user') // 'admin' or 'user'

      // The "Ordering" Permissions
      table.boolean('is_trusted_orderer').defaultTo(false)
      table.boolean('has_completed_onboarding').defaultTo(false)

      table.timestamps(true, true)
    })
  }
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('staff')
}
