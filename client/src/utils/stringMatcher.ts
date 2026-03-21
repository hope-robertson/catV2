export function getMatchScore(itemA: any, itemB: any): 'exact' | 'likely' | 'none' {
  const aArtist = itemA.artist?.toLowerCase().trim() || ''
  const aTitle = itemA.title?.toLowerCase().trim() || ''
  
  const bArtist = (itemB.artist || itemB.Artist)?.toLowerCase().trim() || ''
  const bTitle = (itemB.title || itemB.Title)?.toLowerCase().trim() || ''

  // 1. EXACT MATCH (The Gold Standard)
  if (aArtist === bArtist && aTitle === bTitle) return 'exact'

  // 2. HANDLE "THE" & COMMA REVERSALS
  // e.g. "The Cure" vs "Cure, The"
  const clean = (s: string) => s.replace(/, the$/g, '').replace(/^the /g, '').trim()
  
  if (clean(aArtist) === clean(bArtist) && clean(aTitle) === clean(bTitle)) {
    // Special check for "The The" so we don't return an empty match
    if (aArtist === 'the the' || bArtist === 'the the') return 'exact'
    return 'likely'
  }

  return 'none'
}