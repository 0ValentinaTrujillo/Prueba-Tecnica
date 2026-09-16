import mongoose from 'mongoose';

export const NOTE_STATUSES = ['pendiente', 'en_curso', 'hecho'];

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120, default: 'Nueva nota' },
    text: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: NOTE_STATUSES, default: 'pendiente', index: true },
    position: {
      x: { type: Number, default: 40, min: 0 },
      y: { type: Number, default: 40, min: 0 },
    },
    color: { type: String, default: '#ffe08a' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Note = mongoose.model('Note', noteSchema);
