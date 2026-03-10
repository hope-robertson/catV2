// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value
  const getText = (col: number) => getVal(col)?.toString().trim() || null

  const getPrice = (col: number) => {
    const val = getVal(col)
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  let artist = getText(1)
  let title = getText(2)
  const formatValue = getText(5) || ''
  const binValue = getText(7) || ''

  // Logic for entries starting with "/"
  if (artist?.startsWith('/')) {
    const rawString = artist.substring(1).trim()
    const upperRaw = rawString.toUpperCase()
    const ofIndex = upperRaw.lastIndexOf(' OF ')

    if (ofIndex !== -1) {
      // Case: "/THE STUDIO WIZARDRY OF TODD RUNDGREN"
      // Title becomes the full string, Artist is extracted from the end
      title = rawString
      artist = rawString.substring(ofIndex + 4).trim()
    } else {
      // Case: "/NEW YORK CITY SALSA" or "/SUPERFUNK"
      // Title becomes the string, Artist becomes Various
      title = title ? `${rawString} - ${title}` : rawString
      artist = 'Various'
    }
  }

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: artist || 'Unknown Artist',
    title: title || 'UNTITLED',
    catalogue_number: getText(3),
    barcode: getText(4),
    format: formatValue,
    price: getPrice(6),
    is_nz_music: !!(binValue && binValue.toUpperCase().includes('NZ')),
    label: 'Various',
    released: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: null,
  }
}