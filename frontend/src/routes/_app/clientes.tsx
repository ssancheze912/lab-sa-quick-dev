import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';
import { ClienteForm } from '../../modules/crm/clientes/presentation/ClienteForm';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex h-full">
      <div className="w-[280px] flex flex-col">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold">Clientes</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            data-testid="btn-nuevo-cliente"
            className="text-sm px-3 py-1 bg-[#0e79fd] text-white rounded hover:bg-[#154ca9]"
          >
            Nuevo cliente
          </button>
        </div>
        <ClienteListView />
      </div>
      <ClienteDetailView clienteId={undefined} />
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo cliente"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <ClienteForm onClose={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
