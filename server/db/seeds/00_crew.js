export async function seed(knex) {
  // Clear the deck
  await knex('staff').del()
  await knex('store_settings').del()

  // 1. Insert the Crew
  await knex('staff').insert([
    {
      auth_id: null, // 👈 Leave null to test the "Lazy Linking" handshake!
      name: 'Hope Robertson',
      email: 'hope.robertson.nz@gmail.com', // 👈 MUST match your Auth0 email
      is_admin: true,
      is_trusted_orderer: true,
      trained_open: true,
      trained_close: true,
      color: '#BABEFF',
      genre_expertise: 'Post-Punk, Techno, Industrial',
    },
    {
      auth_id: 'fake|1',
      name: 'Nick W',
      email: 'nick@nickwhite.org',
      is_admin: true,
      is_trusted_orderer: true,
      trained_open: true,
      trained_close: true,
      color: '#FFF369',
      genre_expertise: 'Comics, Psych-Rock, NZ Indie',
    },
    {
      auth_id: 'fake|2',
      name: 'Vee',
      email: 'vee@ridesuper.com',
      is_admin: false,
      is_trusted_orderer: false,
      trained_open: true,
      trained_close: false,
      color: '#F99A9A',
      genre_expertise: 'Ambient, Modern Classical',
    },
  ])

  // 2. Insert Initial Store Settings
  await knex('store_settings').insert([
    { key: 'wealth_level', value: 'ok' },
    { key: 'rent_weekly', value: '450' },
    { key: 'power_monthly', value: '120' },
    { key: 'internet_monthly', value: '80' },
  ])

  console.log('🚀 Manifest Loaded: Crew and Expenses are online.')
}
