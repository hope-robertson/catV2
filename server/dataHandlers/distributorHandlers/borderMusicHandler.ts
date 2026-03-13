import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export async function borderMusicHandler(
  filePath: string,
): Promise<CatalogueRow[]> {
  const workbook = new exceljs.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.getWorksheet(1)
  const results: CatalogueRow[] = []

  worksheet?.eachRow((row, rowNumber) => {
    if (rowNumber <= 5) return // Skip header rows

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

    if (!rawArtist && !rawTitle) return // Skip empty rows

    let finalArtist = rawArtist || 'Various'
    let finalTitle = rawTitle || 'UNKNOWN'

    const upperArtist = rawArtist?.toUpperCase() || ''

    // 1. "OF" Extraction (e.g., SONGBOOK OF DOLLY PARTON)
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
    // 2. "PRESENTS" or Leading Slash (Compilations)
    else if (
      upperArtist.startsWith('/') ||
      upperArtist.includes(' PRESENTS ') ||
      upperArtist.includes(' PRESENT ')
    ) {
      const cleanString = rawArtist!.startsWith('/')
        ? rawArtist!.substring(1).trim()
        : rawArtist!
      finalTitle = rawTitle ? `${cleanString} - ${rawTitle}` : cleanString
      finalArtist = 'Various'
    }
    // 3. Blank Title Fallback (Artist field contains the title, e.g. a compilation name)
    // Only triggers if it doesn't look like a Split Release (no slash in middle)
    else if (!rawTitle && rawArtist && !rawArtist.includes('/')) {
      finalTitle = rawArtist
      finalArtist = 'Various'
    }

    results.push({
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
    })
  })

  return results
}
