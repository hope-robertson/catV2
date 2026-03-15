/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries to prevent duplicates on re-run
  await knex('sections').del()

  await knex('sections').insert([
    { name: 'ALT ROCK/POST ROCK', code: 'ALT', parent_category: 'ALT' },
    { name: 'NOISE/DRONE', code: 'NOI', parent_category: 'ALT' },
    { name: 'AMBIENT', code: 'AMB', parent_category: 'EXP' },
    { name: 'ART ROCK/EXPERIMENTAL', code: 'EXP', parent_category: 'EXP' },
    { name: 'INDIE ROCK', code: 'IND', parent_category: 'ALT' },
    { name: 'JANGLE POP', code: 'JNG', parent_category: 'ALT' },
    { name: 'BEDROOM POP/CARDIGAN MUSIC', code: 'BED', parent_category: 'ALT' },
    { name: 'SHOEGAZE/DREAMPOP', code: 'DRP', parent_category: 'ALT' },
    { name: 'POST PUNK/GOTH', code: 'GTH', parent_category: 'ALT' },
    { name: 'NEW WAVE/POWER POP', code: 'NWV', parent_category: 'P/R' },
    { name: 'SYNTHPOP/SYNTHWAVE', code: 'SYN', parent_category: 'SYN' },
    { name: 'EMO/POST-HARDCORE', code: 'EMO', parent_category: 'ALT' },
    { name: 'FAKE EMO', code: 'MCR', parent_category: 'ALT' },
    { name: 'SURF/TWANG', code: 'SUR', parent_category: 'GAR' },
    { name: 'GARAGE/TRASH', code: 'GAR', parent_category: 'GAR' },
    { name: 'LOUNGE/MOOG/SPACEAGE', code: 'LOU', parent_category: 'LOU' },
    { name: 'ROCK AND ROLL/ROCKABILLY', code: 'RNR', parent_category: 'RNR' },
    { name: 'BEAT BOOM', code: 'BEA', parent_category: 'P/R' },
    { name: 'GIRL GROUPS/DOO-WOP', code: 'DOO', parent_category: 'P/R' },
    { name: 'BRITPOP', code: 'BRT', parent_category: 'ALT' },
    { name: 'PSYCH/PROG ROCK', code: 'PSY', parent_category: 'PSY' },
    { name: 'POP', code: 'POP', parent_category: 'POP' },
    { name: 'COCAINE ROCK', code: 'FBI', parent_category: 'P/R' },
    {
      name: 'DAD/MUM ROCK (WHEN MUSIC WAS GOOD)',
      code: 'DAD',
      parent_category: 'P/R',
    },
    { name: 'INDUSTRIAL', code: 'IDS', parent_category: 'ALT' },
    { name: 'WEIRD/APOCALPYTIC FOLK', code: 'WFK', parent_category: 'FOLK' },

    // HIP HOP
    { name: 'OLD SCHOOL/BOOM BAP', code: 'BAP', parent_category: 'HIP' },
    { name: '90s/2000s HIP-HOP', code: 'HIP', parent_category: 'HIP' },
    { name: 'MEMPHIS/DIRTY SOUTH', code: 'DRT', parent_category: 'HIP' },
    { name: 'TRAP/SOUNDCLOUD/SADBOI', code: 'XAN', parent_category: 'HIP' },
    { name: 'DOWNBEAT/TRIPHOP', code: 'TRP', parent_category: 'HIP' },
    {
      name: 'CONSCIOUS/UNDERGROUND/EXPERIMENTAL',
      code: 'UGD',
      parent_category: 'HIP',
    },

    // COUNTRY & JAZZ
    { name: 'CLASSIC COUNTRY/GOSPEL', code: 'COU', parent_category: 'COU' },
    { name: 'MODERN/ALT COUNTRY', code: 'LYT', parent_category: 'COU' },
    { name: 'AMERICANA', code: 'AME', parent_category: 'COU' },
    { name: 'JAZZ FUSION', code: 'SHT', parent_category: 'JAZZ' },
    { name: 'MODERN JAZZ', code: 'MOD', parent_category: 'JAZZ' },
    { name: 'PRE-WAR JAZZ', code: 'PRE', parent_category: 'JAZZ' },
    { name: 'POST WAR JAZZ', code: 'JAZ', parent_category: 'JAZZ' },

    // METAL
    { name: 'NU METAL', code: 'NU', parent_category: 'MET' },
    {
      name: 'THRASH/SPEED METAL/CROSSOVER',
      code: 'SPD',
      parent_category: 'MET',
    },
    { name: 'CLASSIC METAL', code: 'CLM', parent_category: 'MET' },
    { name: 'DEATH METAL', code: 'DTH', parent_category: 'MET' },
    { name: 'SLUDGE/STONER/DESERT', code: 'THC', parent_category: 'MET' },
    { name: 'BLACK METAL', code: 'BLK', parent_category: 'MET' },
    { name: 'AMBIENT/DRONE METAL', code: 'DNM', parent_category: 'MET' },
    { name: 'FUNERAL/ DOOM CULT', code: 'CLT', parent_category: 'MET' },

    // PUNK
    { name: 'ELECTROPUNK/SYNTHPUNK', code: 'EPK', parent_category: 'PUN' },
    { name: 'GRIND/CRUST/ANARCHO', code: 'GRN', parent_category: 'PUN' },
    { name: 'STREET PUNK/OI', code: 'OI', parent_category: 'PUN' },
    { name: 'HARDCORE/POWERVIOLENCE', code: 'HRD', parent_category: 'PUN' },
    { name: 'FIRST WAVE PUNK', code: 'PUN', parent_category: 'PUN' },
    { name: 'CHOP BONG PUNK', code: 'CHP', parent_category: 'PUN' },
    { name: 'SKA PUNK', code: 'SKP', parent_category: 'PUN' },
  ])
}
