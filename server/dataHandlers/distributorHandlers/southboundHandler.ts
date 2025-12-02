// server/dataHandlers/distributorHandlers/southboundHandler.ts
import exceljs from 'exceljs'
import { CatalogueRow } from '../../types/catalogue.js'

/**
 * Maps a single row from the Southbound spreadsheet to the CatalogueRow object structure.
  * Data starts on row 8. Headers are on row 5.
   * @param row The ExcelJS row object.
    * @returns A structured CatalogueRow object.
     */
     export function mapSouthboundRow(row: exceljs.Row): CatalogueRow {
         // Note: Column index starts at 1 in ExcelJS.
             
                 // Helper to get text value safely
                     const getText = (col: number) => (row.getCell(col).value as string | undefined) || null;

                         // Helper to parse price value safely
                             const getPrice = (col: number) => {
                                     const priceValue = row.getCell(col).value;
                                             if (typeof priceValue === 'number') return priceValue;
                                                     if (typeof priceValue === 'string') {
                                                                 // Attempt to parse string after removing currency symbols if necessary
                                                                             const cleanPrice = parseFloat(priceValue.replace(/[^0-9.]/g, ''));
                                                                                         return isNaN(cleanPrice) ? null : cleanPrice;
                                                                                                 }
                                                                                                         return null;
                                                                                                             }

                                                                                                                 const rowData: CatalogueRow = {
                                                                                                                         imported_at: new Date(),
                                                                                                                                 distributor: 'Southbound Distribution Limited',
                                                                                                                                         
                                                                                                                                                 // Mapped from spreadsheet columns (based on your analysis)
                                                                                                                                                         catalogue_number: getText(1), // Column 1: Cat No
                                                                                                                                                                 description: getText(2),      // Column 2: Description
                                                                                                                                                                         artist: getText(3),           // Column 3: Artist
                                                                                                                                                                                 title: getText(4),            // Column 4: Title
                                                                                                                                                                                         price: getPrice(5),           // Column 5: Dealer (Price)
                                                                                                                                                                                                 format: getText(6),           // Column 6: Format
                                                                                                                                                                                                         barcode: getText(7),          // Column 7: BarCode
                                                                                                                                                                                                                 label: getText(8),            // Column 8: Label
                                                                                                                                                                                                                         genres: getText(9),           // Column 9: Genre
                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                         // Metadata fields (Set explicitly, even if null)
                                                                                                                                                                                                                                                 is_nz_music: false, // Southbound data does not provide this flag
                                                                                                                                                                                                                                                         bin_location: null,
                                                                                                                                                                                                                                                                 item_code: null,
                                                                                                                                                                                                                                                                         unit_sale_price_excl_gst: null,
                                                                                                                                                                                                                                                                                 released: null
                                                                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                                                                         return rowData;
                                                                                                                                                                                                                                                                                         }