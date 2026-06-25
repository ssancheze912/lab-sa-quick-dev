import { createFileRoute } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  return (
    <div className="flex h-full">
      {/* Left panel — fixed 280px scrollable list */}
      <ClienteListPanel />

      {/* Right panel — placeholder until a client is selected (Story 2.2) */}
      <div
        data-testid="cliente-detail-panel"
        className="flex flex-1 items-center justify-center text-slate-400 text-sm"
      >
        <span data-testid="detail-panel-placeholder">
          Selecciona un cliente para ver el detalle
        </span>
      </div>
    </div>
  );
}
