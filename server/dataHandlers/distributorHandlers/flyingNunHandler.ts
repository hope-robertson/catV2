// server/dataHandlers/distributorHandlers/flyingNunHandler.ts
import { CatalogueRow } from '../../types/catalogue.js'

export function mapFlyingNunRow(data: Record<string, string>): CatalogueRow {
  const price =
    parseFloat(
      data['Unit Sale Price excl. GST']?.replace(/[^0-9.]/g, '') || '0',
    ) || null
  const itemName = data['Item Name']?.trim().replace(/^"|"$/g, '') || ''

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: 'Flying Nun Records Limited',
    item_code: data['Item Code'] || null,
    barcode: data.Barcode || data.barcode || null,
    catalogue_number:
      data['Catalogue Number'] ||
      data['Cat #'] ||
      data.catalogue_number ||
      null,
    released: data.Released || data.released || null,
    description: data.Description || data.description || itemName,
    bin_location: data['Bin Location'] || data.Bin || data.bin_location || null,
    price: price,
    unit_sale_price_excl_gst: price,
    artist: null,
    title: null,
    format: null,
    label: null,
    genres: null,
    discogs_release_date: null,
  }

  // Parsing "Artist - Title (Format)"
  const regex = /(.+?)\s*-\s*(.+?)(?:\s*\(([^)]+)\))?\s*$/i
  const match = itemName.match(regex)

  if (match) {
    rowData.artist = match[1]?.trim()
    rowData.title = match[2]?.trim()
    rowData.format = match[3]?.replace(/^"|"$/g, '').replace(/""/g, '"') || null
  } else {
    const parts = itemName.split(' - ')
    rowData.artist = parts.length >= 2 ? parts[0].trim() : null
    rowData.title =
      parts.length >= 2 ? parts.slice(1).join(' - ').trim() : itemName
  }

  return rowData
}
