// server/dataHandlers/distributorHandlers/flyingNunHandler.ts
import { CatalogueRow } from '../../types/catalogue.js'

export function mapFlyingNunRow(data: Record<string, string>): CatalogueRow {
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
    description: data.Description || data.description || null,
    bin_location: data['Bin Location'] || data.Bin || data.bin_location || null,
    label: null, // Flying Nun usually doesn't specify a label column directly
    artist: null,
    title: null,
    format: null,
    price: null,
    discogs_release_date: null,
    genres: null,
    unit_sale_price_excl_gst: null,
  }

  const priceStr = data['Unit Sale Price excl. GST']?.replace('$', '')
  const parsedPrice = priceStr ? parseFloat(priceStr) : null
  rowData.unit_sale_price_excl_gst = parsedPrice
  rowData.price = parsedPrice // Use this as the main price for now

  const itemName = data['Item Name']
  if (itemName) {
    let cleanedItemName = itemName.trim()
    if (cleanedItemName.startsWith('"') && cleanedItemName.endsWith('"')) {
      cleanedItemName = cleanedItemName.slice(1, -1)
    }

    const codePrefixMatch = cleanedItemName.match(/^[^:]+:\s*(.*)/)
    if (codePrefixMatch && codePrefixMatch[1]) {
      cleanedItemName = codePrefixMatch[1].trim()
    }

    const regex = /(.+?)\s*-\s*(.+?)(?:\s*\(([^)]+)\))?\s*$/i
    const match = cleanedItemName.match(regex)

    if (match) {
      rowData.artist = match[1]?.trim() || null
      rowData.title = match[2]?.trim() || null
      let formatRaw = match[3]?.trim()
      if (formatRaw) {
        if (formatRaw.startsWith('"') && formatRaw.endsWith('"')) {
          formatRaw = formatRaw.slice(1, -1)
        }
        rowData.format = formatRaw.replace(/""/g, '"')
      }
    } else {
      const parts = cleanedItemName.split(' - ')
      if (parts.length >= 2) {
        rowData.artist = parts[0]?.trim() || null
        rowData.title = parts.slice(1).join(' - ').trim() || null
      } else {
        rowData.title = cleanedItemName.trim() || null
        rowData.artist = null
      }

      if (!rowData.format) {
        const titleLower = rowData.title?.toLowerCase()
        const itemCodeLower = rowData.item_code?.toLowerCase()

        if (titleLower?.includes('(lp)') || itemCodeLower?.includes('lp'))
          rowData.format = 'LP'
        else if (titleLower?.includes('(cd)') || itemCodeLower?.includes('cd'))
          rowData.format = 'CD'
        else if (titleLower?.includes('(7")') || itemCodeLower?.includes('7'))
          rowData.format = '7"'
        else if (titleLower?.includes('(10")') || itemCodeLower?.includes('10'))
          rowData.format = '10"'
        else if (titleLower?.includes('(12")') || itemCodeLower?.includes('12'))
          rowData.format = '12"'
        else if (
          titleLower?.includes('(cassette)') ||
          itemCodeLower?.includes('cs') ||
          itemCodeLower?.includes('cassette')
        )
          rowData.format = 'Cassette'
        else if (
          titleLower?.includes('(tape)') ||
          itemCodeLower?.includes('tape')
        )
          rowData.format = 'Tape'
        else if (
          titleLower?.includes('(dvd)') ||
          itemCodeLower?.includes('dvd')
        )
          rowData.format = 'DVD'
        else if (
          titleLower?.includes('(blu-ray)') ||
          itemCodeLower?.includes('blu-ray')
        )
          rowData.format = 'Blu-ray'
        else if (titleLower?.includes('(ep)') || itemCodeLower?.includes('ep'))
          rowData.format = 'EP'
        else rowData.format = null
      }
    }
  }

  return rowData
}
