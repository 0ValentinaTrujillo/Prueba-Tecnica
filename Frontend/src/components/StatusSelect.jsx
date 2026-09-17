import { NOTE_STATUSES } from '../constants.js';
import { DoneIcon, InProgressIcon, PendingIcon } from './icons.jsx';
import Dropdown from './Dropdown.jsx';

const STATUS_ICON = {
  pendiente: PendingIcon,
  en_curso: InProgressIcon,
  hecho: DoneIcon,
};

const STATUS_OPTIONS = NOTE_STATUSES.map((status) => ({
  ...status,
  icon: STATUS_ICON[status.value],
}));

export default function StatusSelect({ value, onChange, disabled }) {
  return (
    <Dropdown
      value={value}
      options={STATUS_OPTIONS}
      onChange={onChange}
      disabled={disabled}
      ariaLabel="Estado de la nota"
    />
  );
}
