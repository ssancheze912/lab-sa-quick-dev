import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { Contacto } from '../../contactos/domain/Contacto';

interface ContactManagerProps {
  contactos: Contacto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ContactManager({ contactos, isLoading, isError, onRetry }: ContactManagerProps) {
  if (isLoading) {
    return (
      <div data-testid="contact-manager-loading" role="status" aria-label="Cargando contactos">
        <Skeleton height={20} width="70%" className="mb-2" />
        <Skeleton height={20} width="60%" className="mb-2" />
        <Skeleton height={20} width="65%" />
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="contact-manager-error" className="py-4 text-center">
        <p className="text-sm text-red-600 mb-2">Error al cargar los contactos.</p>
        <button
          data-testid="retry-button"
          onClick={onRetry}
          className="text-sm font-medium text-[#0e79fd] hover:text-[#154ca9] underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (contactos.length === 0) {
    return (
      <div data-testid="contact-manager-empty" className="py-4 text-center">
        <p className="text-sm text-slate-500">Sin contactos vinculados a este cliente.</p>
      </div>
    );
  }

  return (
    <ul data-testid="contact-manager-list" className="divide-y divide-slate-100 space-y-0">
      {contactos.map((contacto) => (
        <li key={contacto.id} className="py-3">
          <p className="text-sm font-medium text-slate-900">{contacto.nombre}</p>
          {contacto.cargo && (
            <p className="text-xs text-slate-500 mt-0.5">{contacto.cargo}</p>
          )}
          {contacto.email && (
            <p className="text-xs text-slate-400 mt-0.5">{contacto.email}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
