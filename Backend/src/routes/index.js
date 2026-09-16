import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { login, logout, me } from '../controllers/authController.js';
import {
  createUser,
  listUsers,
  setUserStatus,
  updateUser,
} from '../controllers/userController.js';
import {
  createNote,
  deleteNote,
  listNotes,
  moveNote,
  updateNote,
} from '../controllers/noteController.js';
import { getMetrics } from '../controllers/dashboardController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Autenticación
router.post('/auth/login', login);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, me);

// Administración de usuarios (solo administradores)
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users', authenticate, requireAdmin, createUser);
router.put('/users/:id', authenticate, requireAdmin, updateUser);
router.patch('/users/:id/status', authenticate, requireAdmin, setUserStatus);

// Tablero compartido (cualquier usuario activo)
router.get('/notes', authenticate, listNotes);
router.post('/notes', authenticate, createNote);
router.put('/notes/:id', authenticate, updateNote);
router.patch('/notes/:id/position', authenticate, moveNote);
router.delete('/notes/:id', authenticate, deleteNote);

// Dashboard (métricas calculadas por AWS Lambda)
router.get('/dashboard/metrics', authenticate, getMetrics);

export default router;
