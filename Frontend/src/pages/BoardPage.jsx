import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import NoteCard from '../components/NoteCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { NOTE_COLORS } from '../constants.js';

const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 250;
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1600;

const clamp = (value, max) => Math.min(Math.max(Math.round(value), 0), max);

export default function BoardPage() {
  const { handleAuthError } = useAuth();
  const toast = useToast();
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { notes: list } = await api.listNotes();
      setNotes(list);
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Arrastrar y soltar ---------------------------------------------------
  // Pointer Events unifica mouse y touch: así el arrastre también funciona
  // con el dedo en móvil/tablet, sin duplicar la lógica para cada uno.
  const handleDragStart = useCallback((event, note) => {
    // Solo botón izquierdo (o contacto táctil) y solo desde la cabecera de la nota.
    if (event.button !== 0) return;
    event.preventDefault();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id: note.id,
      grabX: event.clientX - canvasRect.left - note.position.x,
      grabY: event.clientY - canvasRect.top - note.position.y,
      position: note.position,
    };
    setDraggingId(note.id);
  }, []);

  useEffect(() => {
    if (!draggingId) return undefined;

    function onPointerMove(event) {
      const drag = dragRef.current;
      if (!drag) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: clamp(event.clientX - canvasRect.left - drag.grabX, CANVAS_WIDTH - NOTE_WIDTH),
        y: clamp(event.clientY - canvasRect.top - drag.grabY, CANVAS_HEIGHT - NOTE_HEIGHT),
      };
      drag.position = position;
      setNotes((current) =>
        current.map((note) => (note.id === drag.id ? { ...note, position } : note))
      );
    }

    async function onPointerUp() {
      const drag = dragRef.current;
      dragRef.current = null;
      setDraggingId(null);
      if (!drag) return;

      // Al soltar, la nueva posición se guarda automáticamente.
      try {
        const { note } = await api.moveNote(drag.id, drag.position);
        setNotes((current) => current.map((item) => (item.id === note.id ? note : item)));
      } catch (err) {
        if (!handleAuthError(err)) toast.error(`No se pudo guardar la posición: ${err.message}`);
        load();
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingId, handleAuthError, load, toast]);

  // --- Acciones sobre notas -----------------------------------------------
  async function handleCreate() {
    const scroller = canvasRef.current?.parentElement;
    try {
      const { note } = await api.createNote({
        title: 'Nueva nota',
        text: '',
        status: 'pendiente',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        position: {
          x: clamp((scroller?.scrollLeft ?? 0) + 40, CANVAS_WIDTH - NOTE_WIDTH),
          y: clamp((scroller?.scrollTop ?? 0) + 40, CANVAS_HEIGHT - NOTE_HEIGHT),
        },
      });
      setNotes((current) => [...current, note]);
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
    }
  }

  async function handleSave(id, draft) {
    try {
      const { note } = await api.updateNote(id, draft);
      setNotes((current) => current.map((item) => (item.id === id ? note : item)));
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
    }
  }

  async function confirmDelete() {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await api.deleteNote(id);
      setNotes((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
    }
  }

  return (
    <section className="page board-page">
      <header className="page-header">
        <div>
          <h1>Tablero compartido</h1>
          <p className="muted">
            Arrastra las notas por la cabecera; la posición se guarda al soltarlas.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-logout" onClick={load}>
            Recargar
          </button>
          <button type="button" className="btn-refresh" onClick={handleCreate}>
            <PlusIcon className="btn-refresh-icon" />
            Nueva nota
          </button>
        </div>
      </header>

      {loading && <div className="centered-state">Cargando tablero…</div>}

      <div className="canvas-scroller">
        <div
          ref={canvasRef}
          className="canvas"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              dragging={draggingId === note.id}
              onDragStart={handleDragStart}
              onSave={handleSave}
              onDelete={setPendingDeleteId}
            />
          ))}

          {!loading && notes.length === 0 && (
            <p className="canvas-empty">
              El tablero está vacío. Crea la primera nota con «Nueva nota».
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Eliminar nota"
        message="¿Eliminar esta nota? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  );
}
