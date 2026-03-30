export async function up(knex) {
  await knex.schema.createTable('polls', (table) => {
    table.increments('id').primary()
    table.string('question').notNullable()
    table.json('options') // Store as ["Option A", "Option B"]
    table.date('expires_at')
    table.boolean('is_active').defaultTo(true)
    table.timestamps(true, true)
  })

  await knex.schema.createTable('poll_votes', (table) => {
    table.increments('id').primary()
    table.integer('poll_id').references('polls.id')
    table.integer('staff_id').references('staff.id')
    table.string('vote')
    table.unique(['poll_id', 'staff_id']) // One person, one vote
  })

  await knex.schema.createTable('news', (table) => {
    table.increments('id').primary()
    table.string('headline').notNullable()
    table.text('content')
    table.date('expires_at')
    table.timestamps(true, true)
  })

  await knex.schema.createTable('news_reads', (table) => {
    table.integer('news_id').references('news.id')
    table.integer('staff_id').references('staff.id')
    table.primary(['news_id', 'staff_id'])
  })
}
