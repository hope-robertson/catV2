// server/utils/csvHelpers.ts
import csv from 'csv-parser'
import fs from 'node:fs/promises'
import { Readable } from 'node:stream'
import { CatalogueRow } from '../types/catalogue.js'

export async function processCsvRows(
  filePath: string,
  numRowsToSkip: number,
  mapRowFunction: (
    data: Record<string, string>,
    distributor: string
  ) => CatalogueRow,
  distributorForMapping: string,
  filterFormat: 'All' | 'LP' | 'CD' = 'All'
): Promise<CatalogueRow[]> {
  const data: CatalogueRow[] = []
  const results: unknown[] = []

  const readStream = Readable.from(await fs.readFile(filePath))

  await new Promise<void>((resolve, reject) => {
    readStream
      .pipe(csv({ skipLines: numRowsToSkip }))
      .on('data', (row) => results.push(row))
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
  })

  for (const row of results) {
    const mappedRow = mapRowFunction(
      row as Record<string, string>,
      distributorForMapping
    )
    const rowFormat = mappedRow.format?.toLowerCase()
    const desiredFormat = filterFormat.toLowerCase()

    if (
      desiredFormat === 'all' ||
      (rowFormat && rowFormat.includes(desiredFormat))
    ) {
      data.push(mappedRow)
    }
  }
  return data
}
