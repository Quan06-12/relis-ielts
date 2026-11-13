import mongoose from 'mongoose'

// One time a user takes a test (collection "attempts").
const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    value: { type: [String], default: [] }, // several items only for multi_select
  },
  { _id: false }
)

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    // Set when the test is a class assignment (Sprint 3); null means practising alone
    assignmentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    classId: { type: mongoose.Schema.Types.ObjectId, default: null },
    mode: {
      type: { type: String, enum: ['full', 'parts'], required: true },
      sectionIndexes: { type: [Number], required: true },
      timeLimitMin: { type: Number, required: true, min: 1, max: 180 },
    },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    answers: { type: [answerSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    // Filled by scoring in Sprint 2 (US35)
    result: {
      type: { correct: Number, total: Number, band: Number },
      default: null,
    },
  },
  { timestamps: true }
)

// History page and "unfinished attempt" lookups
attemptSchema.index({ userId: 1, startedAt: -1 })
attemptSchema.index({ userId: 1, testId: 1, status: 1 })
// Class gradebook (US40)
attemptSchema.index({ classId: 1, status: 1 })

export const Attempt = mongoose.model('Attempt', attemptSchema)
