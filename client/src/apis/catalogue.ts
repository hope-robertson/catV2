import request from 'superagent'
import { MasterCatalogueRow } from '../models/catalogue.js'

const rootUrl = '/api/v1/catalogue'

export async function searchCatalogue(
  query: string,
  filter: string,
  token: string,
): Promise<MasterCatalogueRow[]> {
  // We use .set() to attach the Auth0 token to the superagent request
  const res = await request
    .get(`${rootUrl}/search`)
    .set('Authorization', `Bearer ${token}`)
    .query({ q: query, filter }) // Updated 'query' to 'q' to match our backend route

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

export async function updateRating(
  id: number,
  rating: number,
  token: string,
): Promise<void> {
  await request
    .patch(`${rootUrl}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ id, rating })
}
