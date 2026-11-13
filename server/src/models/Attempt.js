import mongoose from 'mongoose'

// One time a user takes a test (collection "attempts").
const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    value: { type: [String], default: [] }, // several items only for multi_select
    correct: { type: Boolean }, // filled when the attempt is submitted (US35), absent before
  },
  { _id: false }
)

// Score saved when the attempt is submitted (US35). No _id: it is a value, not a document.
const resultSchema = new mongoose.Schema(
  {
    correct: Number,
    total: Number,
    band: Number, // null when only some sections were practised
  },
  { _id: false }
)

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    // Set when the test is a class assignment (US44); null means practising alone or from the class library
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
    // Filled by scoring when the attempt is submitted (US35)
    result: { type: resultSchema, default: null },
    // Handed in after the assignment deadline (only possible when the teacher allows late work, US44)
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// History page and "unfinished attempt" lookups
attemptSchema.index({ userId: 1, startedAt: -1 })
attemptSchema.index({ userId: 1, testId: 1, status: 1 })
// Class gradebook (US40)
attemptSchema.index({ classId: 1, status: 1 })
// Assignments tab (US44, US45)
attemptSchema.index({ assignmentId: 1, userId: 1 })

export const Attempt = mongoose.model('Attempt', attemptSchema)
