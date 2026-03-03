// server/dataHandlers/distributorHandlers/rhythmethodGroupHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

export function mapRhythmethodGroupRow(
  row: exceljs.Row,
  actualDistributor: string,
): CatalogueRow {
  const getValue = (col: number) =>
    row.getCell(col).value?.toString().trim() || null
  const description = getValue(3) || ''

  const rowData: CatalogueRow = {
    imported_at: new Date(),
    distributor: actualDistributor,
    catalogue_number: getValue(2),
    barcode: getValue(4),
    description: description,
    price: parseFloat(getValue(5)?.replace(/[^0-9.]/g, '') || '0') || null,
    stock_on_hand: parseInt(getValue(6) || '0') || 0,
    is_nz_music: false,
    label: actualDistributor.includes('Sony')
      ? 'Sony Music'
      : actualDistributor.includes('Warner')
        ? 'Warner Music'
        : 'Rhythmethod',
    artist: null,
    title: null,
    format: null,
    released: null,
    genres: null,
  }

  const regex =
    /(.+?)\s*-\s*(.+?)(?:\s*(\d+LP|\d+CD|CD|LP|7"|10"|12"|Cassette|Tape|DVD|Blu-ray|EP))?$/i
  const match = description.match(regex)

  if (match) {
    rowData.artist = match[1]?.trim()
    rowData.title = match[2]?.trim()
    rowData.format = match[3]?.trim()
  }

  return rowData
}
