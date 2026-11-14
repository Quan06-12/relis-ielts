import mongoose from 'mongoose'

// A test is stored as one document with everything nested inside:
// test → sections (passages / parts) → groups of questions → questions.
// It is always opened whole and has at most 40 questions, so nesting is simpler than separate collections.

// No _id: a range is a value, not a document
const evidenceSchema = new mongoose.Schema({ start: Number, end: Number }, { _id: false })

const questionSchema = new mongoose.Schema({
  number: { type: Number },                       // 1..n across the whole test, set by the server
  prompt: { type: String, default: '' },
  options: { type: [String], default: [] },       // choices for multiple choice, T/F/NG, matching
  answers: { type: [String], default: [] },       // every accepted answer, e.g. ["10", "ten"]
  explanation: { type: [String], default: [] },   // step-by-step explanation for the review page
  evidence: { type: evidenceSchema, default: null }, // character range in the passage or transcript (US18)
})

const groupSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'multi_select', 'tfng', 'ynng', 'matching', 'completion', 'short_answer'],
    required: true,
  },
  instruction: { type: String, default: '' },
  questions: { type: [questionSchema], default: [] },
})

const sectionSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  passage: { type: String, default: '' },          // Reading
  audioUrl: { type: String, default: null },       // Listening
  audioDurationSec: { type: Number, default: null },
  transcript: { type: String, default: '' },       // Listening, shown only on the review page
  groups: { type: [groupSchema], default: [] },
})

const testSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    skill: { type: String, enum: ['reading', 'listening'], required: true },
    kind: { type: String, enum: ['full', 'single'], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    coverUrl: { type: String, default: null },
    durationMin: { type: Number, min: 1, max: 180, required: true },
    sections: { type: [sectionSchema], default: [] },
    questionCount: { type: Number, default: 0 },
    // A deleted test that someone already took is hidden instead of removed,
    // so history and gradebooks still work
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Test = mongoose.model('Test', testSchema)
