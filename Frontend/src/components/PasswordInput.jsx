import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/**
 * <input type="password"> con botón de ojo para alternar su visibilidad.
 * `className` se aplica al input (para que herede el diseño de campo que
 * corresponda — el de las notas en los modales, el del login en Login).
 */
export default function PasswordInput({ className = '', id, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...inputProps}
        id={id}
        type={visible ? 'text' : 'password'}
        className={`password-field-input${className ? ` ${className}` : ''}`}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-controls={id}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
