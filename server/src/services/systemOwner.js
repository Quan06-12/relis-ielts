import { User } from '../models/User.js'

// System tests belong to a built-in "Relis" account that nobody can sign in to
export const SYSTEM_GOOGLE_ID = 'system-relis'

export function findOrCreateSystemOwner() {
  return User.findOneAndUpdate(
    { googleId: SYSTEM_GOOGLE_ID },
    { $setOnInsert: { googleId: SYSTEM_GOOGLE_ID, email: 'system@relis.site', name: 'Relis' } },
    { upsert: true, returnDocument: 'after' }
  )
}
