import { useEffect, useState } from 'react';
import { DEFAULT_NOTE_COLOR, NOTE_STATUSES } from '../constants.js';
import StatusSelect from './StatusSelect.jsx';

/**
 * Nota tipo post-it. El título, el texto y el estado se editan sobre la propia
 * nota y se confirman con "Guardar"; la posición, en cambio, se guarda sola al
 * soltar la nota (lo gestiona el tablero).
 */
export default function NoteCard({ note, dragging, onDragStart, onSave, onDelete }) {
  const [draft, setDraft] = useState({ title: note.title, text: note.text, status: note.status });
  const [saving, setSaving] = useState(false);

  // Si la nota cambia desde el servidor (recarga), el borrador se re-sincroniza.
  useEffect(() => {
    setDraft({ title: note.title, text: note.text, status: note.status });
  }, [note.id, note.title, note.text, note.status]);

  const dirty =
    draft.title !== note.title || draft.text !== note.text || draft.status !== note.status;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(note.id, draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className={`note${dragging ? ' note-dragging' : ''}`}
      style={{
        left: note.position.x,
        top: note.position.y,
        background: note.color ?? DEFAULT_NOTE_COLOR,
      }}
    >
      <header className="note-handle" onPointerDown={(event) => onDragStart(event, note)}>
        <span className="note-grip" aria-hidden="true">
          ⠿
        </span>
        <span className={`note-badge note-badge-${note.status}`}>
          {NOTE_STATUSES.find((s) => s.value === note.status)?.label}
        </span>
      </header>

      <input
        className="note-title"
        value={draft.title}
        maxLength={120}
        placeholder="Título"
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />

      <textarea
        className="note-text"
        value={draft.text}
        maxLength={2000}
        placeholder="Escribe aquí…"
        onChange={(e) => setDraft({ ...draft, text: e.target.value })}
      />

      <StatusSelect
        value={draft.status}
        onChange={(status) => setDraft({ ...draft, status })}
      />

      <footer className="note-actions">
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          className="btn btn-danger btn-small"
          onClick={() => onDelete(note.id)}
        >
          Eliminar
        </button>
      </footer>
    </article>
  );
}
