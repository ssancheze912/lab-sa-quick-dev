import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
});

function ClienteDetailPage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

      {/* Left panel — fixed 280px scrollable list with active highlight */}
      <ClienteListPanel
        activeClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />

      {/* Right panel — detail view for the selected client */}
      <ClienteDetailPanel clienteId={clienteId} onNotify={handleNotify} />
    </div>
  );
}
