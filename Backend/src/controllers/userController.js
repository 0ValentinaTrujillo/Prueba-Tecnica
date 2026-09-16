import { ROLES, User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const MIN_PASSWORD = 8;

/** Impide quedarse sin ningún administrador activo. */
async function assertAdminRemains(userId) {
  const remaining = await User.countActiveAdmins(userId);
  if (remaining === 0) {
    throw new ApiError(409, 'Debe quedar al menos un administrador activo');
  }
}

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.toJSON()) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user', active = true } = req.body ?? {};

  if (!name || !email || !password) {
    throw new ApiError(400, 'Nombre, correo electrónico y contraseña son obligatorios');
  }
  if (String(password).length < MIN_PASSWORD) {
    throw new ApiError(422, `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
  }
  if (!ROLES.includes(role)) {
    throw new ApiError(422, 'Rol no válido');
  }

  const user = await User.create({ name, email, password, role, active: Boolean(active) });
  res.status(201).json({ user: user.toJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body ?? {};
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Usuario no encontrado');

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password) {
    if (String(password).length < MIN_PASSWORD) {
      throw new ApiError(422, `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
    }
    user.password = password;
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new ApiError(422, 'Rol no válido');
    // Degradar al último administrador activo dejaría la aplicación sin administración.
    if (user.role === 'admin' && role !== 'admin' && user.active) {
      await assertAdminRemains(user.id);
    }
    user.role = role;
  }

  await user.save();
  res.json({ user: user.toJSON() });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const { active } = req.body ?? {};
  if (typeof active !== 'boolean') {
    throw new ApiError(400, 'El campo "active" debe ser booleano');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Usuario no encontrado');

  if (!active) {
    if (user.id === req.user.id) {
      throw new ApiError(409, 'No puedes desactivar tu propia cuenta');
    }
    if (user.role === 'admin') await assertAdminRemains(user.id);
  }

  user.active = active;
  await user.save();
  res.json({ user: user.toJSON() });
});
