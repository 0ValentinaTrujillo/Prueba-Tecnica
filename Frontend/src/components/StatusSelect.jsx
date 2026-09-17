import { useEffect, useId, useRef, useState } from 'react';
import { NOTE_STATUSES } from '../constants.js';
import { ChevronDownIcon, DoneIcon, InProgressIcon, PendingIcon } from './icons.jsx';

const STATUS_ICON = {
  pendiente: PendingIcon,
  en_curso: InProgressIcon,
  hecho: DoneIcon,
};

/**
 * Desplegable de estado a medida (sustituye al <select> nativo, cuyo menú no
 * se puede personalizar de forma fiable entre navegadores). Funciona como un
 * listbox: clic, teclado (flechas/Enter/Escape) y cierre al perder el foco.
 */
export default function StatusSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(() =>
    NOTE_STATUSES.findIndex((status) => status.value === value)
  );
  const rootRef = useRef(null);
  const listboxId = useId();

  const selectedIndex = NOTE_STATUSES.findIndex((status) => status.value === value);
  const selected = NOTE_STATUSES[selectedIndex] ?? NOTE_STATUSES[0];
  const SelectedIcon = STATUS_ICON[selected.value];

  useEffect(() => {
    if (!open) return undefined;
    setHighlighted(selectedIndex === -1 ? 0 : selectedIndex);

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function commit(index) {
    const status = NOTE_STATUSES[index];
    setOpen(false);
    if (status && status.value !== value) onChange(status.value);
  }

  function onTriggerKeyDown(event) {
    if (disabled) return;

    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlighted((i) => Math.min(i + 1, NOTE_STATUSES.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlighted((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setHighlighted(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlighted(NOTE_STATUSES.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(highlighted);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className={`status-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="status-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="status-select-value">
          <SelectedIcon className="status-select-icon" />
          {selected.label}
        </span>
        <ChevronDownIcon className="status-select-chevron" />
      </button>

      {open && (
        <ul className="status-select-menu" role="listbox" id={listboxId} tabIndex={-1}>
          {NOTE_STATUSES.map((status, index) => {
            const Icon = STATUS_ICON[status.value];
            const isSelected = status.value === value;
            return (
              <li
                key={status.value}
                role="option"
                aria-selected={isSelected}
                className={`status-select-option${isSelected ? ' is-selected' : ''}${
                  index === highlighted ? ' is-highlighted' : ''
                }`}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => commit(index)}
              >
                <Icon className="status-select-icon" />
                {status.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
