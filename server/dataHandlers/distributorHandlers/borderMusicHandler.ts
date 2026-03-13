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

    const strVal = val.toString().trim()
    // Remove $, commas, and spaces
    const cleanVal = strVal.replace(/[$,\s]/g, '')
    const parsed = parseFloat(cleanVal)

    return isNaN(parsed) ? null : parsed
  }

  let artist = getText(1)
  let title = getText(2)
  const catNo = getText(3)
  const formatValue = getText(5) || ''
  const binValue = getText(7) || ''
  const priceValue = getPrice(6)

  // Debugging: If you aren't seeing prices, check your console for these logs
  if (catNo && !priceValue) {
    console.log(
      `[Border Debug] Row for ${catNo} missing price. Raw cell value:`,
      row.getCell(6).value,
    )
  }

  if (artist?.startsWith('/')) {
    const rawString = artist.substring(1).trim()
    const upperRaw = rawString.toUpperCase()
    const ofIndex = upperRaw.lastIndexOf(' OF ')

    if (ofIndex !== -1) {
      title = rawString
      artist = rawString.substring(ofIndex + 4).trim()
    } else {
      title = title ? `${rawString} - ${title}` : rawString
      artist = 'Various'
    }
  }

  return {
    imported_at: new Date(),
    distributor: 'Border Music',
    artist: artist || 'Unknown Artist',
    title: title || 'UNTITLED',
    catalogue_number: catNo,
    barcode: getText(4),
    format: formatValue,
    price: priceValue,
    is_nz_music: !!(binValue && binValue.toUpperCase().includes('NZ')),
    label: 'Various',
    released: null,
    genres: null,
    item_code: null,
    unit_sale_price_excl_gst: priceValue, // Map price to here as well
  }
}
