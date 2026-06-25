import { useState } from 'react';
import { createFileRoute, useNavigate, Outlet, useChildMatches } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel';
import { ClienteForm } from '@/modules/crm/clientes/presentation/ClienteForm';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  const navigate = useNavigate();
  const childMatches = useChildMatches();
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // If a child route ($clienteId) is matched, delegate rendering entirely to Outlet.
  // The child route (clientes.$clienteId.tsx) manages its own layout and active state.
  if (childMatches.length > 0) {
    return <Outlet />;
  }

  function handleClienteSelect(id: string) {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } });
  }

  function handleNotify(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="flex h-full relative">
      {/* Toast notifications */}
      {notification?.type === 'success' && (
        <div
          data-testid="toast-success"
          role="status"
          aria-live="polite"
          className="absolute top-4 right-4 z-50 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800 shadow"
        >
          {notification.message}
        </div>
      )}
      {notification?.type === 'error' && (
        <div
          data-testid="toast-error"
          role="alert"
          aria-live="assertive"
          className="absolute top-4 right-4 z-50 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800 shadow"
        >
          {notification.message}
        </div>
      )}

      {/* Left panel — fixed 280px scrollable list, with "Nuevo cliente" button */}
      <div className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Header with button */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-sm font-bold text-slate-700">Clientes</span>
          <button
            data-testid="btn-nuevo-cliente"
            type="button"
            onClick={() => setIsCreating(true)}
            aria-label="Crear nuevo cliente"
            className="rounded-md bg-[#0e79fd] px-3 py-1 text-xs font-bold text-white hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          >
            Nuevo cliente
          </button>
        </div>
        <ClienteListPanel
          activeClienteId={undefined}
          onClienteSelect={handleClienteSelect}
        />
      </div>

      {/* Right panel — ClienteForm when creating, placeholder otherwise */}
      {isCreating ? (
        <div className="flex-1 overflow-y-auto">
          <ClienteForm
            mode="create"
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
            onNotify={handleNotify}
          />
        </div>
      ) : (
        <ClienteDetailPanel clienteId={undefined} />
      )}
    </div>
  );
}
