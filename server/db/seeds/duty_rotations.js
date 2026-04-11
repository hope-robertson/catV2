export async function seed(knex) {
  await knex('duty_rotations').del()

  // 1. Fetch all current staff IDs
  const staffMembers = await knex('staff').select('id')
  const allIds = staffMembers.map((s) => s.id)

  if (allIds.length === 0) return // Safety check

  // 2. Build the rotation using the actual IDs found in the DB
  await knex('duty_rotations').insert([
    {
      duty_type: 'rostering',
      current_staff_id: allIds[0], // Start with the first person found
      frequency: 'weekly',
      last_cycle_date: knex.fn.now(),
      queue_order: JSON.stringify(allIds), // Everyone is in the queue
    },
    {
      duty_type: 'ordering',
      current_staff_id: allIds[0],
      frequency: 'fortnightly',
      last_cycle_date: knex.fn.now(),
      queue_order: JSON.stringify(allIds),
    },
  ])
}
