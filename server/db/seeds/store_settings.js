/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deleting existing entries to avoid duplicates
  await knex('store_settings').del()

  await knex('store_settings').insert([
    { key: 'wealth_level', value: 'ok' },
    { key: 'rent_weekly', value: '450' },
    { key: 'power_monthly', value: '120' },
    { key: 'internet_monthly', value: '80' },
    { key: 'rostering_frequency', value: 'weekly' },
  ])
}
