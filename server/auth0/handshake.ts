// server/auth0/handshake.ts
import knex from '../db/connection.js'

export async function syncUserWithManifest(authUser: any) {
  const { sub: authId, email } = authUser

  if (!email) return null

  // 1. Find them by email (The Whitelist)
  const staffMember = await knex('staff').where('email', email).first()

  if (!staffMember) return null

  // 2. Lazy-link: If they are on the list but haven't logged in before
  if (!staffMember.auth_id) {
    await knex('staff').where('id', staffMember.id).update({ auth_id: authId })

    // Return the updated record
    return { ...staffMember, auth_id: authId }
  }

  // 3. Match check: Ensure the Auth0 ID matches the one we have on file
  if (staffMember.auth_id !== authId) {
    return null
  }

  return staffMember
}
