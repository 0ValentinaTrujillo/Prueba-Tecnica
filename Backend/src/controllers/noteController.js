import { Note, NOTE_STATUSES } from '../models/Note.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const CANVAS_LIMIT = 10000;

function sanitizeCoordinate(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(Math.round(num), 0), CANVAS_LIMIT);
}

export const listNotes = asyncHandler(async (_req, res) => {
  const notes = await Note.find().sort({ createdAt: 1 });
  res.json({ notes: notes.map((n) => n.toJSON()) });
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, text, status, position, color } = req.body ?? {};

  if (status && !NOTE_STATUSES.includes(status)) {
    throw new ApiError(422, 'Estado no válido');
  }

  const note = await Note.create({
    title: title?.trim() || 'Nueva nota',
    text: text ?? '',
    status: status ?? 'pendiente',
    color: color ?? undefined,
    position: {
      x: sanitizeCoordinate(position?.x, 40),
      y: sanitizeCoordinate(position?.y, 40),
    },
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });

  res.status(201).json({ note: note.toJSON() });
});

export const updateNote = asyncHandler(async (req, res) => {
  const { title, text, status, color } = req.body ?? {};
  const note = await Note.findById(req.params.id);
  if (!note) throw new ApiError(404, 'Nota no encontrada');

  if (title !== undefined) note.title = title.trim() || 'Nueva nota';
  if (text !== undefined) note.text = text;
  if (color !== undefined) note.color = color;
  if (status !== undefined) {
    if (!NOTE_STATUSES.includes(status)) throw new ApiError(422, 'Estado no válido');
    note.status = status;
  }
  note.updatedBy = req.user.id;

  await note.save();
  res.json({ note: note.toJSON() });
});

/** Guardado automático al soltar la nota en el lienzo. */
export const moveNote = asyncHandler(async (req, res) => {
  const { x, y } = req.body?.position ?? req.body ?? {};
  const note = await Note.findById(req.params.id);
  if (!note) throw new ApiError(404, 'Nota no encontrada');

  note.position = {
    x: sanitizeCoordinate(x, note.position.x),
    y: sanitizeCoordinate(y, note.position.y),
  };
  note.updatedBy = req.user.id;

  await note.save();
  res.json({ note: note.toJSON() });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) throw new ApiError(404, 'Nota no encontrada');
  res.status(204).send();
});
