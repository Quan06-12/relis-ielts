import mongoose from 'mongoose'

// A test given to a class as homework with a deadline (collection "assignments", US44).
const assignmentSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: true },
    // true: students may still hand in after the deadline, and the attempt is marked late
    allowLate: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// "Assignments" tab, nearest deadline first
assignmentSchema.index({ classId: 1, deadline: 1 })

export const Assignment = mongoose.model('Assignment', assignmentSchema)
