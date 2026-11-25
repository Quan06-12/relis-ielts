import mongoose from 'mongoose'

// One document per person (collection "users"). An account signs in with Google (googleId),
// with an email and password (passwordHash), or both once a password account also uses Google.
const userSchema = new mongoose.Schema(
  {
    // sparse: many password-only accounts have no googleId, and that must not break uniqueness
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
