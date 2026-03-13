// server/dataHandlers/distributorHandlers/borderMusicHandler.ts
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

  let rawArtist = getText(1)
  let rawTitle = getText(2)
  const catNo = getText(3)
  const priceValue = getPrice(6)

  let finalArtist = rawArtist || 'Unknown Artist'
  let finalTitle = rawTitle || 'UNKNOWN'

  // Normalize for logic checks
  const upperArtist = rawArtist?.toUpperCase() || ''

  // CASE 1: The "OF" Extraction (Songbooks/Projects)
  // Handles: "/A WAY TO MAKE A LIVING: THE DOLLY PARTON SONGBOOK"
  const ofMatch = upperArtist.match(/\s+OF\s+([^/]+)$/)
  if (
    ofMatch &&
    (upperArtist.includes('SONGBOOK') || upperArtist.startsWith('/'))
  ) {
    finalTitle = rawArtist!.startsWith('/')
      ? rawArtist!.substring(1).trim()
      : rawArtist!
    finalArtist = ofMatch[1].trim()
  }

  // CASE 2: The "Presenter" or Compilation Slash
  // Handles: "BOBBY GILLESPIE PRESENTS..." or "/NEW YORK CITY SALSA"
  else if (
    upperArtist.startsWith('/') ||
    upperArtist.includes(' PRESENTS ') ||
    upperArtist.includes(' PRESENT ')
  ) {
    const cleanString = rawArtist!.startsWith('/')
      ? rawArtist!.substring(1).trim()
      : rawArtist!
    // If the spreadsheet title is empty, use the cleanString as title and Various as artist
    if (!rawTitle) {
      finalTitle = cleanString
      finalArtist = 'Various'
    } else {
      // If there IS a title (e.g. Artist: "/SUPERFUNK", Title: "VOL 2")
      finalTitle = `${cleanString} - ${rawTitle}`
      finalArtist = 'Various'
    }
  }

  // CASE 3: Empty Title Fallback (General)
  // If no logic triggered but title is empty, move artist to title
  else if (!rawTitle && rawArtist) {
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
