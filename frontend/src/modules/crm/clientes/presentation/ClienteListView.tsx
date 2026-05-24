import { useState, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { ClientListItem } from '../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

interface ClienteListViewProps {
  selectedClienteId?: string;
  onClienteSelect: (id: string) => void;
}

export function ClienteListView({ selectedClienteId, onClienteSelect }: ClienteListViewProps) {
  const { data: clientes = [], isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
    );
  }, [clientes, searchQuery]);

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex-shrink-0 flex flex-col h-full border-r border-slate-200 overflow-y-auto"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          type="search"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre o NIT/RUC"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} data-testid="skeleton-row">
                <Skeleton height={56} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={() => void refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && searchQuery === '' && (
          <EmptyState message="No hay clientes registrados. Crea el primero." />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && searchQuery !== '' && (
          <EmptyState message="No se encontraron clientes con ese criterio." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="list" className="divide-y divide-slate-100">
            {filteredClientes.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={cliente.id === selectedClienteId}
                onClick={() => onClienteSelect(cliente.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
