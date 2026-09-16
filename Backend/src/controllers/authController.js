import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    throw new ApiError(400, 'Correo electrónico y contraseña son obligatorios');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Credenciales incorrectas');
  }
  if (!user.active) {
    throw new ApiError(403, 'Cuenta desactivada. Contacta con un administrador.');
  }

  res.json({ token: issueToken(user), user: user.toJSON() });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/**
 * La sesión es un JWT sin estado: el cliente descarta el token.
 * El endpoint existe para que el frontend tenga un punto único de cierre de sesión.
 */
export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Sesión cerrada' });
});
