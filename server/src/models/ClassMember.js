import mongoose from 'mongoose'

// Who belongs to which class, and as what (collection "classmembers").
// The role is per class: the same person can teach one class and study in another.
const classMemberSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['teacher', 'student'], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// One membership per person per class. The database enforces it, so two
// "join" requests sent at the same moment cannot both succeed.
classMemberSchema.index({ classId: 1, userId: 1 }, { unique: true })
// "My classes" page
classMemberSchema.index({ userId: 1 })

export const ClassMember = mongoose.model('ClassMember', classMemberSchema)
