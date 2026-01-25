// client/apis/catalogue.ts
import request from 'superagent'
// We add the .ts or .js extension to satisfy the "node16" rule
import { MasterCatalogueRow } from '../models/catalogue.js'

const rootUrl = '/api/v1/catalogue'

export async function searchCatalogue(
  query: string,
  filter: string,
): Promise<MasterCatalogueRow[]> {
  const res = await request.get(`${rootUrl}/search`).query({ query, filter })

  return res.body
}

export async function updateRating(id: number, rating: number): Promise<void> {
  await request.patch(`${rootUrl}/rating`).send({ id, rating })
}
