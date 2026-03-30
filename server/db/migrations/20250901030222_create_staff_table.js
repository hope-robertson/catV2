export async function up(knex) {
  const tableExists = await knex.schema.hasTable('staff')
  if (!tableExists) {
    return knex.schema.createTable('staff', (table) => {
      table.increments('id').primary()
      table.string('auth_id').unique().notNullable()
      table.string('name').notNullable()
      table.string('email').unique()
      table.string('phone')
      table.string('preferred_contact').defaultTo('email') // 'email' or 'text'
      table.boolean('ok_to_text').defaultTo(false)
      table.string('color').defaultTo('#BABEFF') // The "Pirate Color" for the roster

      // Roles & Permissions
      table.boolean('is_admin').defaultTo(false)
      table.boolean('is_trusted_orderer').defaultTo(false)

      // The Training Checklist
      table.boolean('trained_open').defaultTo(false)
      table.boolean('trained_close').defaultTo(false)
      table.boolean('trained_mail_orders').defaultTo(false)
      table.boolean('trained_restocking').defaultTo(false)
      table.boolean('trained_data_entry').defaultTo(false)
      table.boolean('trained_books').defaultTo(false)
      table.boolean('trained_comics').defaultTo(false)

      // Expertise & Onboarding
      table.text('genre_expertise')
      table.text('fav_comics_response') // "Name 2+ fav comics"
      table.text('fav_books_response') // "What's a book?"
      table.boolean('has_completed_onboarding').defaultTo(false)

      table.timestamps(true, true)
    })
  }
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('staff')
}
