// client/models/staff.ts

export interface Staff {
  id: number
  auth_id: string
  name: string
  email: string | null
  phone: string | null
  preferred_contact: 'email' | 'text'
  ok_to_text: boolean
  color: string // For the "Pirate" roster colors

  // Roles & Permissions
  is_admin: boolean
  is_trusted_orderer: boolean

  // Training Checklist
  trained_open: boolean
  trained_close: boolean
  trained_mail_orders: boolean
  trained_restocking: boolean
  trained_data_entry: boolean
  trained_books: boolean
  trained_comics: boolean

  // Expertise & Intake
  genre_expertise: string | null
  fav_comics_response: string | null
  fav_books_response: string | null
  has_completed_onboarding: boolean

  created_at?: string
  updated_at?: string
}
