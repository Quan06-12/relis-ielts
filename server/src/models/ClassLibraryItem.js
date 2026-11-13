import mongoose from 'mongoose'

// A test placed in a class library (collection "classlibraryitems", US21).
// The test still belongs to the teacher; the class only keeps a reference to it.
const classLibraryItemSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// The same test cannot be added to the same class twice
classLibraryItemSchema.index({ classId: 1, testId: 1 }, { unique: true })

export const ClassLibraryItem = mongoose.model('ClassLibraryItem', classLibraryItemSchema)
