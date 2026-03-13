import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapBorderMusicRow(row: exceljs.Row): CatalogueRow {
  const getVal = (col: number) => row.getCell(col).value
  const getText = (col: number) => getVal(col)?.toString().trim() || null
  const getPrice = (col: number) => {
    const val = getVal(col)
    if (val === null || val === undefined) return null
    if (typeof val === 'number') return val
    const cleanVal = val
      .toString()
      .trim()
      .replace(/[$,\s]/g, '')
    const parsed = parseFloat(cleanVal)
    return isNaN(parsed) ? null : parsed
  }

  const rawArtist = getText(1)
  const rawTitle = getText(2)
  const catNo = getText(3)
  const priceValue = getPrice(6)

  let finalArtist = rawArtist || 'Various'
  let finalTitle = rawTitle || 'UNKNOWN'
  const upperArtist = rawArtist?.toUpperCase() || ''

  const ofMatch = upperArtist.match(/\s+OF\s+([^/]+)$/)
  if (
    ofMatch &&
    (upperArtist.includes('SONGBOOK') || upperArtist.startsWith('/'))
  ) {
    finalTitle = rawArtist!.startsWith('/')
      ? rawArtist!.substring(1).trim()
      : rawArtist!
    finalArtist = ofMatch[1].trim()
  } else if (
    upperArtist.startsWith('/') ||
    upperArtist.includes(' PRESENTS ') ||
    upperArtist.includes(' PRESENT ')
  ) {
    const cleanString = rawArtist!.startsWith('/')
      ? rawArtist!.substring(1).trim()
      : rawArtist!
    finalTitle = rawTitle ? `${cleanString} - ${rawTitle}` : cleanString
    finalArtist = 'Various'
  } else if (!rawTitle && rawArtist && !rawArtist.includes('/')) {
    finalTitle = rawArtist
    finalArtist = 'Various'
  }

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: finalArtist,
    title: finalTitle,
    catalogue_number: catNo,
    barcode: getText(4),
    format: getText(5) || '',
    price: priceValue,
    is_nz_music: !!getText(7)?.toUpperCase().includes('NZ'),
    label: 'Various',
    released: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: priceValue,
  }
}
