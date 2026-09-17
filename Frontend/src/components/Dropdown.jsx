import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons.jsx';

/**
 * Desplegable a medida (listbox) — sustituye al <select> nativo, cuyo menú
 * no se puede personalizar de forma fiable entre navegadores. Lo usan tanto
 * el estado de las notas como el rol de usuario: un solo componente, un
 * solo diseño. `options`: [{ value, label, icon?: Componente }].
 */
export default function Dropdown({ value, options, onChange, disabled, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(() =>
    options.findIndex((option) => option.value === value)
  );
  const rootRef = useRef(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex] ?? options[0];
  const SelectedIcon = selected?.icon;

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
    const option = options[index];
    setOpen(false);
    if (option && option.value !== value) onChange(option.value);
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
        setHighlighted((i) => Math.min(i + 1, options.length - 1));
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
        setHighlighted(options.length - 1);
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
    <div className={`dropdown${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="dropdown-value">
          {SelectedIcon && <SelectedIcon className="dropdown-icon" />}
          {selected?.label}
        </span>
        <ChevronDownIcon className="dropdown-chevron" />
      </button>

      {open && (
        <ul className="dropdown-menu" role="listbox" id={listboxId} tabIndex={-1}>
          {options.map((option, index) => {
            const Icon = option.icon;
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`dropdown-option${isSelected ? ' is-selected' : ''}${
                  index === highlighted ? ' is-highlighted' : ''
                }`}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => commit(index)}
              >
                {Icon && <Icon className="dropdown-icon" />}
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
