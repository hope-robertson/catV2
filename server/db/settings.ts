import knex from './connection.js'

export async function getWealthLevel(): Promise<string> {
  const setting = await knex('store_settings')
    .where({ key: 'wealth_level' })
    .first()
  return setting?.value || 'ok'
}

export async function updateWealthLevel(
  value: string,
  authId: string,
): Promise<void> {
  await knex('store_settings')
    .insert({
      key: 'wealth_level',
      value: value,
      updated_by_auth_id: authId,
      updated_at: knex.fn.now(),
    })
    .onConflict('key')
    .merge(['value', 'updated_by_auth_id', 'updated_at'])
}
