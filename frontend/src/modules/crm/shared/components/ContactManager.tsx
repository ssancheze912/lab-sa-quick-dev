import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { Contacto } from '../../contactos/domain/Contacto';
import { ContactSearchDialog } from './ContactSearchDialog';

interface ContactManagerProps {
  contactos: Contacto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAddContact?: (contactoId: string) => Promise<void>;
  onRemoveContact?: (contactoId: string) => Promise<void>;
  onCreateContact?: (data: {
    nombre: string;
    cargo: string;
    telefono: string;
    email: string;
  }) => Promise<void>;
  clienteId?: string;
}

export function ContactManager({
  contactos,
  isLoading,
  isError,
  onRetry,
  onAddContact,
  onRemoveContact,
  onCreateContact,
  clienteId,
}: ContactManagerProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [confirmDisassociateId, setConfirmDisassociateId] = useState<string | null>(null);

  // Create contact form state
  const [createNombre, setCreateNombre] = useState('');
  const [createCargo, setCreateCargo] = useState('');
  const [createTelefono, setCreateTelefono] = useState('');
  const [createEmail, setCreateEmail] = useState('');

  const handleAddContact = async (contactoId: string) => {
    if (onAddContact) {
      await onAddContact(contactoId);
    }
    setIsSearchDialogOpen(false);
  };

  const handleConfirmDisassociate = async () => {
    if (onRemoveContact && confirmDisassociateId) {
      await onRemoveContact(confirmDisassociateId);
    }
    setConfirmDisassociateId(null);
  };

  const handleCreateContact = async () => {
    if (onCreateContact) {
      await onCreateContact({
        nombre: createNombre,
        cargo: createCargo,
        telefono: createTelefono,
        email: createEmail,
      });
    }
    setIsCreateFormOpen(false);
    setCreateNombre('');
    setCreateCargo('');
    setCreateTelefono('');
    setCreateEmail('');
  };

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

  return (
    <>
      {/* Action buttons — only rendered when action props are provided */}
      {(onAddContact || onCreateContact) && (
        <div className="flex items-center gap-2 mb-3">
          {onAddContact && (
            <button
              type="button"
              data-testid="associate-contact-button"
              onClick={() => setIsSearchDialogOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
            >
              Asociar contacto existente
            </button>
          )}
          {onCreateContact && (
            <button
              type="button"
              data-testid="create-contact-button"
              onClick={() => setIsCreateFormOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Crear nuevo contacto
            </button>
          )}
        </div>
      )}

      {contactos.length === 0 ? (
        <div data-testid="contact-manager-empty" className="py-4 text-center">
          <p className="text-sm text-slate-500">Sin contactos vinculados a este cliente.</p>
        </div>
      ) : (
        <ul data-testid="contact-manager-list" className="divide-y divide-slate-100 space-y-0">
          {contactos.map((contacto) => (
            <li key={contacto.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{contacto.nombre}</p>
                {contacto.cargo && (
                  <p className="text-xs text-slate-500 mt-0.5">{contacto.cargo}</p>
                )}
                {contacto.email && (
                  <p className="text-xs text-slate-400 mt-0.5">{contacto.email}</p>
                )}
              </div>
              {onRemoveContact && (
                <button
                  type="button"
                  data-testid={`disassociate-contact-button-${contacto.id}`}
                  onClick={() => setConfirmDisassociateId(contacto.id)}
                  className="ml-2 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Search dialog for associating existing contacts */}
      {onAddContact && clienteId && (
        <ContactSearchDialog
          open={isSearchDialogOpen}
          onClose={() => setIsSearchDialogOpen(false)}
          onSelect={handleAddContact}
          currentClienteId={clienteId}
        />
      )}

      {/* Confirmation dialog for disassociation */}
      {confirmDisassociateId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirmar desasociación"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setConfirmDisassociateId(null)} />
          <div className="relative z-50 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              ¿Desasociar este contacto?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              El contacto quedará disponible para asociar a otro cliente.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisassociateId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDisassociate}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create contact form dialog */}
      {isCreateFormOpen && onCreateContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Crear nuevo contacto"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsCreateFormOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Crear nuevo contacto</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  data-testid="contacto-nombre-input"
                  value={createNombre}
                  onChange={(e) => setCreateNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  data-testid="contacto-cargo-input"
                  value={createCargo}
                  onChange={(e) => setCreateCargo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  data-testid="contacto-telefono-input"
                  value={createTelefono}
                  onChange={(e) => setCreateTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  data-testid="contacto-email-input"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCreateFormOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="contacto-submit-button"
                onClick={handleCreateContact}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
