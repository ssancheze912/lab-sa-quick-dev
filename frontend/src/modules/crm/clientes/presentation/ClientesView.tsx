import { ClienteDetailView } from './ClienteDetailView';
import { ClienteListView } from './ClienteListView';

interface ClientesViewProps {
  selectedClienteId?: string;
}

export function ClientesView({ selectedClienteId }: ClientesViewProps = {}) {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView selectedClienteId={selectedClienteId} />
      <div className="flex-1">
        {selectedClienteId ? (
          <ClienteDetailView clienteId={selectedClienteId} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            Selecciona un cliente para ver sus detalles
          </div>
        )}
      </div>
    </div>
  );
}
