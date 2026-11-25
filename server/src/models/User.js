import mongoose from 'mongoose'

// One document per person (collection "users"). An account signs in either with Google
// (googleId + email) or with a username and password it created itself (username + passwordHash).
const userSchema = new mongoose.Schema(
  {
    // sparse: the unique check skips accounts that do not have the field
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    // Never sent to the client and not loaded unless asked for (.select('+passwordHash'))
    passwordHash: { type: String, select: false },
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
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (document, json) => {
        delete json._id
        delete json.passwordHash
        return json
      },
    },
  }
)

export const User = mongoose.model('User', userSchema)
