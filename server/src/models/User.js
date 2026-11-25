import mongoose from 'mongoose'
import { isAdminUser } from '../utils/admin.js'

// One document per person (collection "users"): someone who signed in with Google,
// or a guest who chose "Dùng thử không cần tài khoản" (no googleId, no email, isGuest = true).
const userSchema = new mongoose.Schema(
  {
    // sparse: guests have neither field, and that must not break uniqueness
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    // A guest can do everything except create or join classes; signing in with Google later
    // turns the guest into that Google account and keeps their tests and attempts
    isGuest: { type: Boolean, default: false },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    // Target bands on the home page (US46)
    goals: {
      reading: { type: Number, default: null },
      listening: { type: Number, default: null },
      overall: { type: Number, default: null },
    },
    examDate: { type: Date, default: null },
  },
  { timestamps: true }
)

// Sent with the user (toJSON includes virtuals), so the client can show the admin pages
userSchema.virtual('isAdmin').get(function isAdmin() {
  return isAdminUser(this)
})

export const User = mongoose.model('User', userSchema)
