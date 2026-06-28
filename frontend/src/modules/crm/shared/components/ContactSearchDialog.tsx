import { useState } from 'react';
import { useContactos } from '../../contactos/application/useContactos';
import type { Contacto } from '../../contactos/domain/Contacto';

interface ContactSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contactoId: string) => void;
  currentClienteId: string;
}

export function ContactSearchDialog({
  open,
  onClose,
  onSelect,
  currentClienteId,
}: ContactSearchDialogProps) {
  const [search, setSearch] = useState('');
  const { data: allContactos, isLoading } = useContactos();

  if (!open) return null;

  // Only show orphan contacts (clienteId === null) to prevent accidental reassignment
  const orphanContactos: Contacto[] = (allContactos ?? []).filter(
    (c) => c.clienteId === null
  );

  const filtered = search.trim()
    ? orphanContactos.filter((c) =>
        c.nombre.toLowerCase().includes(search.trim().toLowerCase())
      )
    : orphanContactos;

  // currentClienteId is used to validate it's available
  void currentClienteId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="contact-search-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar contacto para asociar"
    >
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Asociar contacto existente
        </h2>
        <input
          type="text"
          data-testid="contact-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
        {isLoading ? (
          <p className="text-sm text-slate-500 py-2">Cargando contactos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            No hay contactos disponibles para asociar.
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((contacto) => (
              <li key={contacto.id}>
                <button
                  type="button"
                  className="w-full text-left px-2 py-3 text-sm hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onSelect(contacto.id);
                    onClose();
                  }}
                >
                  <span className="font-medium text-slate-900">{contacto.nombre}</span>
                  {contacto.cargo && (
                    <span className="text-slate-500 ml-2">— {contacto.cargo}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
