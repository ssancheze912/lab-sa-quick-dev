import { Link } from '@tanstack/react-router';
import type { Contacto } from '../domain/Contacto';

interface ContactoListItemProps {
  contacto: Contacto;
  isActive?: boolean;
}

export function ContactoListItem({ contacto, isActive = false }: ContactoListItemProps) {
  return (
    <li data-testid="contacto-list-item">
      <Link
        to="/contactos/$contactoId"
        params={{ contactoId: contacto.id }}
        aria-label={`Ver contacto ${contacto.nombre}`}
        aria-current={isActive ? 'page' : undefined}
        className={[
          'block px-4 py-3 border-b border-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd]',
          isActive
            ? 'bg-[#0e79fd] text-white hover:bg-[#154ca9]'
            : 'hover:bg-slate-100',
        ].join(' ')}
      >
        <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
          {contacto.nombre}
        </p>
        <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
          {contacto.cargo}
        </p>
        <p className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
          {contacto.email}
        </p>
      </Link>
    </li>
  );
}
