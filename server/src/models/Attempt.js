import mongoose from 'mongoose'
const { Schema } = mongoose
const attemptSchema = new Schema(
  {
    _id: String,
    userId: { type: String, required: true },
    testId: { type: String, required: true },
    classId: { type: String, default: null },
    assignmentId: { type: String, default: null },
    mode: { type: Schema.Types.Mixed, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['in_progress', 'submitted'], required: true },
    answers: { type: [Schema.Types.Mixed], default: [] },
    result: { type: Schema.Types.Mixed, default: null },
    grading: { type: [Schema.Types.Mixed], default: [] },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    revision: { type: Number, default: 0 },
  },
  { versionKey: false },
)
attemptSchema.index({ userId: 1, startedAt: -1 })
attemptSchema.index(
  { userId: 1, testId: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } },
)
export const Attempt = mongoose.model('Attempt', attemptSchema)
