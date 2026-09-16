import { ApiError } from '../utils/ApiError.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'Recurso no encontrado'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  if (error?.name === 'ValidationError') {
    const details = Object.values(error.errors).map((e) => e.message);
    return res.status(422).json({ error: 'Datos no válidos', details });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ error: 'Identificador no válido' });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' });
  }

  console.error('[error]', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
