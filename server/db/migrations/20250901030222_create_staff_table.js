export async function up(knex) {
  const tableExists = await knex.schema.hasTable('staff')
  if (!tableExists) {
    return knex.schema.createTable('staff', (table) => {
      table.increments('id').primary()

      // 🎯 THE FIX: Removed .notNullable()
      // This allows "Lazy Linking" where we only have an email at first.
      table.string('auth_id').unique()

      table.string('name').notNullable()
      table.string('email').unique()
      table.string('phone')
      table.string('preferred_contact').defaultTo('email')
      table.boolean('ok_to_text').defaultTo(false)
      table.string('color').defaultTo('#BABEFF')

      table.boolean('is_admin').defaultTo(false)
      table.boolean('is_trusted_orderer').defaultTo(false)

      table.boolean('trained_open').defaultTo(false)
      table.boolean('trained_close').defaultTo(false)
      table.boolean('trained_mail_orders').defaultTo(false)
      table.boolean('trained_restocking').defaultTo(false)
      table.boolean('trained_data_entry').defaultTo(false)
      table.boolean('trained_books').defaultTo(false)
      table.boolean('trained_comics').defaultTo(false)

      table.text('genre_expertise')
      table.text('fav_comics_response')
      table.text('fav_books_response')
      table.boolean('has_completed_onboarding').defaultTo(false)

      table.timestamps(true, true)
    })
  }
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('staff')
}
