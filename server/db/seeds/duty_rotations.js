/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('duty_rotations').del()

  // Assuming staff IDs exist from your staff seed
  await knex('duty_rotations').insert([
    {
      duty_type: 'rostering',
      current_staff_id: 1, // Start with Nick W
      frequency: 'weekly',
      last_cycle_date: knex.fn.now(),
      queue_order: JSON.stringify([1, 12, 2, 5]), // [Nick, Hope, Vee, Elise]
    },
    {
      duty_type: 'ordering',
      current_staff_id: 12, // Start with Hope
      frequency: 'fortnightly',
      last_cycle_date: knex.fn.now(),
      queue_order: JSON.stringify([12, 1, 9]), // [Hope, Nick, Nick R]
    },
  ])
}
