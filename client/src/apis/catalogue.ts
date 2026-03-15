import request from 'superagent'
import { MasterCatalogueRow } from '../models/catalogue.js'

const rootUrl = '/api/v1/catalogue'

export async function searchCatalogue(
  query: string,
  filter: string,
  token: string,
): Promise<MasterCatalogueRow[]> {
  console.log(`[API] Searching for: "${query}" with filter: "${filter}"`)

  const res = await request
    .get(`${rootUrl}/search`)
    .set('Authorization', `Bearer ${token}`)
    .query({ q: query, filter })

  console.log(`[API] received ${res.body.length} results`)
  return res.body
}

export async function getFullMasterList(
  token: string,
): Promise<MasterCatalogueRow[]> {
  const res = await request
    .get(`${rootUrl}/master`)
    .set('Authorization', `Bearer ${token}`)
  return res.body
}

export async function getCollisions(token: string) {
  const res = await request
    .get(`${rootUrl}/collisions`)
    .set('Authorization', `Bearer ${token}`)
  return res.body
}

export async function resolveCollision(
  id: number,
  action: 'promote' | 'dismiss',
  token: string,
) {
  const res = await request
    .post(`${rootUrl}/collisions/resolve`)
    .set('Authorization', `Bearer ${token}`)
    .send({ id, action })
  return res.body
}
