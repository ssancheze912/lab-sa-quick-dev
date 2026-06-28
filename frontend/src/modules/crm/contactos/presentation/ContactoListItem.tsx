import type { Contacto } from '../domain/Contacto';

interface ContactoListItemProps {
  contacto: Contacto;
  onClick: () => void;
}

export function ContactoListItem({ contacto, onClick }: ContactoListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <li
      data-testid="contacto-list-item"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd]"
    >
      <p className="text-sm font-semibold text-slate-900">{contacto.nombre}</p>
      <p className="text-xs text-slate-500">{contacto.cargo}</p>
      <p className="text-xs text-slate-400">{contacto.email}</p>
    </li>
  );
}
