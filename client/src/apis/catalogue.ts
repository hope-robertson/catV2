import request from 'superagent'
import { MasterCatalogueRow } from '../models/catalogue.js'

// Prefixes the Railway production backend URL on Vercel, while falling back to relative path in dev (for Vite proxy)
const baseUrl = import.meta.env.VITE_API_URL || ''
const rootUrl = `${baseUrl}/api/v1/catalogue`

export async function searchCatalogue(
  query: string,
  distributor: string,
  sort: string,
  format: string,
  token: string,
): Promise<MasterCatalogueRow[]> {
  const res = await request
    .get(`${rootUrl}/search`)
    .set('Authorization', `Bearer ${token}`)
    .query({ q: query, distributor, sort, format })

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
