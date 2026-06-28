import { useState } from 'react';
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView';
import { ClienteForm } from '../../modules/crm/clientes/presentation/ClienteForm';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
});

function ClientesLayout() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const params = useParams({ strict: false });
  const activeClienteId = 'clienteId' in params ? (params as { clienteId: string }).clienteId : undefined;

  return (
    <div className="flex h-full">
      <div className="w-40 sm:w-[280px] shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h1 className="font-bold">Clientes</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            data-testid="btn-nuevo-cliente"
            className="text-sm px-3 py-1 bg-[#0e79fd] text-white rounded hover:bg-[#154ca9]"
          >
            Nuevo cliente
          </button>
        </div>
        <ClienteListView activeClienteId={activeClienteId} />
      </div>
      <Outlet />
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
