import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'user'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo electrónico no válido'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Mongoose 9: los hooks async no reciben "next", basta con resolver la promesa.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

/** Número de administradores activos, excluyendo opcionalmente un id. */
userSchema.statics.countActiveAdmins = function countActiveAdmins(excludeId = null) {
  const filter = { role: 'admin', active: true };
  if (excludeId) filter._id = { $ne: excludeId };
  return this.countDocuments(filter);
};

export const User = mongoose.model('User', userSchema);
