import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verifica el token, carga el usuario y bloquea a los inactivos.
 * Un usuario desactivado deja de tener acceso aunque su token siga vigente.
 */
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Token no proporcionado');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new ApiError(401, 'Token inválido o expirado');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'El usuario ya no existe');
    if (!user.active) throw new ApiError(403, 'Cuenta desactivada. Contacta con un administrador.');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Se requiere rol de administrador'));
  }
  next();
}
