import mongoose from 'mongoose'

// One document per person who signed in with Google (collection "users").
const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
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

export const User = mongoose.model('User', userSchema)
