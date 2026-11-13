import mongoose from 'mongoose'

// The 5 colours offered in the "create class" dialog (US04)
export const CLASS_COLORS = ['purple', 'blue', 'green', 'orange', 'pink']

// A class (collection "classes"). Who is in it lives in classMembers.
const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    color: { type: String, enum: CLASS_COLORS, default: 'purple' },
    code: { type: String, required: true, unique: true }, // 6 characters students type to join (US05, US06)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export const Class = mongoose.model('Class', classSchema)
