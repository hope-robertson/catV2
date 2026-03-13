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
    .query({ q: query, filter }) // We are sending it as 'q'

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
