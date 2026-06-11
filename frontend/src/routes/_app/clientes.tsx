import { createFileRoute } from '@tanstack/react-router';
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListPanel />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-center h-full text-slate-400">
          <p className="text-sm">Selecciona un cliente para ver los detalles</p>
        </div>
      </main>
    </div>
  );
}
