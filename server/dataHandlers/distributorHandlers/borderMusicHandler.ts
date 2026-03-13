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

  let artist = getText(1)
  let title = getText(2)
  const catNo = getText(3)
  const priceValue = getPrice(6)

  if (catNo)
    console.log(`[Border Handler] Row ${catNo}: PriceParsed=${priceValue}`)

  if (artist?.startsWith('/')) {
    console.log(`[Border Handler] Slash detected in Artist: ${artist}`)
    const rawString = artist.substring(1).trim()
    const upperRaw = rawString.toUpperCase()
    const ofIndex = upperRaw.lastIndexOf(' OF ')

    if (ofIndex !== -1) {
      title = rawString
      artist = rawString.substring(ofIndex + 4).trim()
      console.log(`[Border Handler] 'OF' Logic: Artist=${artist}`)
    } else {
      title = title ? `${rawString} - ${title}` : rawString
      artist = 'Various'
      console.log(`[Border Handler] 'Various' Logic assigned`)
    }
  }

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: artist || 'Unknown Artist',
    title: title || 'UNTITLED',
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
