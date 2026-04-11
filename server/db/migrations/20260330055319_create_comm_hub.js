/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Create Polls Table
  await knex.schema.createTable('polls', (table) => {
    table.increments('id').primary()
    table.string('question').notNullable()
    table.json('options') // Store as ["Option A", "Option B"]
    table.date('expires_at')
    table.boolean('is_active').defaultTo(true)
    table.timestamps(true, true)
  })

  // 2. Create Poll Votes (Linking Polls to Staff)
  await knex.schema.createTable('poll_votes', (table) => {
    table.increments('id').primary()
    table
      .integer('poll_id')
      .unsigned()
      .references('id')
      .inTable('polls')
      .onDelete('CASCADE')
    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('CASCADE')
    table.string('vote')
    table.unique(['poll_id', 'staff_id']) // One person, one vote
  })

  // 3. Create News Table
  await knex.schema.createTable('news', (table) => {
    table.increments('id').primary()
    table.string('headline').notNullable()
    table.text('content')
    table.date('expires_at')
    table.timestamps(true, true)
  })

  // 4. Create News Reads (Tracking who has seen what)
  await knex.schema.createTable('news_reads', (table) => {
    table
      .integer('news_id')
      .unsigned()
      .references('id')
      .inTable('news')
      .onDelete('CASCADE')
    table
      .integer('staff_id')
      .unsigned()
      .references('id')
      .inTable('staff')
      .onDelete('CASCADE')
    table.primary(['news_id', 'staff_id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop in reverse order of creation to avoid foreign key conflicts
  await knex.schema.dropTableIfExists('news_reads')
  await knex.schema.dropTableIfExists('news')
  await knex.schema.dropTableIfExists('poll_votes')
  await knex.schema.dropTableIfExists('polls')
}
