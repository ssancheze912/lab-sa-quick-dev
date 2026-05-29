import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../../application/hooks/useClientes';
import { ClientListItem } from '../../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../../shared/components/ErrorPanel';

interface ClienteListViewProps {
  onClientSelect?: (id: string) => void;
}

export function ClienteListView({ onClientSelect }: ClienteListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { data: clientes = [], isLoading, isError, refetch } = useClientes();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    const q = searchQuery.toLowerCase();
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    );
  }, [clientes, searchQuery]);

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex flex-col h-full border-r border-slate-200 overflow-y-auto"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          data-testid="clientes-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC..."
          aria-label="Buscar clientes"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-[#0e79fd] placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div data-testid="clientes-loading-skeleton" className="p-3">
            <Skeleton count={8} height={56} className="mb-1" />
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={refetch} />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            message="No hay clientes registrados. Crea el primer cliente para comenzar."
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div role="list">
            {filtered.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                onClick={onClientSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
