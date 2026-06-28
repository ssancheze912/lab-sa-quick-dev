import { useState } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView';
import { ContactoForm } from '../../modules/crm/contactos/presentation/ContactoForm';

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
});

function ContactosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h1 className="text-base font-bold text-slate-900">Contactos</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            data-testid="btn-nuevo-contacto"
            className="rounded bg-[#0e79fd] px-3 py-1 text-xs font-medium text-white hover:bg-[#154ca9]"
          >
            Nuevo contacto
          </button>
        </div>
        <ContactoListView />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo contacto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <ContactoForm onClose={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

