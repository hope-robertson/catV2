// client/models/catalogue.ts

export interface MasterCatalogueRow {
  id: number
  artist: string | null
  title: string
  label: string | null
  format: string | null
  barcode: string | null
  catalogue_number: string | null
  price: number | null
  source_distributor: string
  is_nz_music: boolean | null
  // rating: number                // Commented out since we removed it from the UI
}
