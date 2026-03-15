// server/db/seeds/00_admin_bootstrap.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing staff and settings to start fresh
  await knex('staff').del()
  await knex('store_settings').del()

  // 1. Insert YOU as the Master Admin
  await knex('staff').insert([
    {
      auth_id: 'auth0|6980003daa2e2e58f1e0fc68',
      name: 'Hope',
      email: 'your_email@example.com', // 👈 Change this!
      role: 'admin',
      is_trusted_orderer: true,
      has_completed_onboarding: true,
    },
  ])

  // 2. Set the initial Global Store Health
  await knex('store_settings').insert([{ key: 'wealth_level', value: 'ok' }])

  console.log('🚀 Bootstrap Complete: Hope is Admin and Wealth is set to OK.')
}
