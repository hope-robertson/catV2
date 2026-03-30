export async function seed(knex) {
  await knex('staff').del()
  await knex('staff').insert([
    {
      auth_id: 'auth0|654321', // Replace with your actual Auth0 ID for testing
      name: 'Hope Robertson',
      email: 'hope@example.com',
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
      email: 'nick@example.com',
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
      email: 'vee@example.com',
      is_admin: false,
      is_trusted_orderer: false,
      trained_open: true,
      trained_close: false,
      color: '#F99A9A',
      genre_expertise: 'Ambient, Modern Classical',
    },
  ])
}
