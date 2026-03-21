// server/types/catalogue.ts

import exceljs from 'exceljs' // Import exceljs for Worksheet type

export interface CatalogueRow {
  imported_at: Date
  distributor: string
  artist?: string | null
  title?: string | null
  catalogue_number?: string | null
  barcode?: string | null
  format?: string | null
  price?: number | null
  bin_location?: string | null
  label?: string | null
  description?: string | null // To store raw description for Rhythmethod
  released?: string | null
  discogs_release_date?: string | null
  genres?: string | null // Specific to Flying Nun, if you need to retain it raw before consolidation:
  item_code?: string | null
  unit_sale_price_excl_gst?: number | null
  is_nz_music?: boolean | null
  stock_on_hand?: number | null
}

export interface MasterCatalogueRow extends CatalogueRow {
  id: number
  source_distributor: string
  last_imported_at: Date
  discogs_release_id?: number | null
  discogs_master_id?: number | null
  discogs_release_date?: string | null
  genres?: string | null
  styles?: string | null
  image_url?: string | null
  tracklist?: string | null
  is_nz_music?: boolean | null
  stock_on_hand?: number | null
  rating: number // ⭐ Changed from number | null to just number
}

export interface CustomError {
  message: string
  code?: string
  errno?: number
  stack?: string
}

export interface UploadResponse {
  message: string
  insertedCount?: number
}

// Define a type for a distributor handler function
// This function takes the file path and format filter, and returns a promise of CatalogueRow[]
export type DistributorHandler = (
  filePath: string,
  formatType: 'All' | 'LP' | 'CD',
) => Promise<CatalogueRow[]>

// Define a type for distributor specific configurations
export interface DistributorConfig {
  rawTableName: any
  name: string // Display name for the frontend
  value: string // The value sent from the frontend (used for internal logic)
  fileType: 'xlsx' | 'csv'
  accept: string // File input accept attribute
  sheets?: Record<string, string> // For multi-sheet Excels: sheetName -> actualDistributor for mapping
  headerRowsToSkip: number // Number of rows to skip for single sheet
  requiresFormatFilter?: boolean // Does the frontend need to show format filter for this?
}

// Define a type for the mapping functions used by processExcelRows/processCsvRows
export type ExcelRowMapper = (
  row: exceljs.Row,
  distributor: string,
) => CatalogueRow
export type CsvRowMapper = (
  data: Record<string, string>,
  distributor: string,
) => CatalogueRow

export interface DistributorConfig {
  // --- Existing Import Logic ---
  rawTableName: any
  name: string 
  value: string 
  fileType: 'xlsx' | 'csv'
  accept: string 
  sheets?: Record<string, string> 
  headerRowsToSkip: number 
  requiresFormatFilter?: boolean 

  // --- NEW Procurement & Pricing Logic ---
  origin: 'local' | 'import'
  currency: 'NZD' | 'USD' | 'JPY' | 'GBP'
  defaultFreightPerItem?: number // Optional, as some (like consignment) might not have it
}
