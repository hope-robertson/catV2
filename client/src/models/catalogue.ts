// client/models/catalogue.ts

export interface MasterCatalogueRow {
  id: number
  artist: string
  title: string
  label: string | null
  format: string | null
  barcode: string | null
  price: number | null
  rating: number // 0, 1, 2, or 3
  is_nz_music: boolean | null
  // ... add any other fields you want to display
}
