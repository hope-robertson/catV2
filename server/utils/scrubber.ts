// server/utils/scrubber.ts

/**
 * The Scrubber: Cleans and normalizes incoming catalogue data
 */
export const scrubber = {
  // 1. Clean strings (Trim spaces and handle nulls)
  text: (val: string | null | undefined): string => {
    if (!val) return 'UNKNOWN'
    return val.toString().trim()
  },

  // 2. Clean Barcodes (The big one!)
  // Handles '5.01E+12' from Excel and removes quotes/apostrophes
  barcode: (val: any): string => {
    if (!val) return ''
    let cleaned = val.toString().trim()

    // Remove leading apostrophes (common in Excel to force string)
    cleaned = cleaned.replace(/^'/, '')

    // Handle Scientific Notation (e.g., 5.01E+12)
    if (cleaned.includes('E+') || cleaned.includes('e+')) {
      return BigInt(Number(cleaned)).toString()
    }

    return cleaned
  },

  // 3. Normalize Artist Names
  // Ensures "The Beatles" and "THE BEATLES" are handled consistently
  artist: (val: string): string => {
    const cleaned = scrubber.text(val)
    // Optional: Force Title Case (e.g., PINK FLOYD -> Pink Floyd)
    // For now, let's just make sure it's not all caps if it's messy
    return cleaned
  },

  // 4. Boolean helper
  // Converts 'yes', '1', 'true' etc. to actual boolean for SQLite
  boolean: (val: any): boolean => {
    const v = String(val).toLowerCase().trim()
    return v === 'true' || v === '1' || v === 'yes' || v === 'nz'
  },
}
