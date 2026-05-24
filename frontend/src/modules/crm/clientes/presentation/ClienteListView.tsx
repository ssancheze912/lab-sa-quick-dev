import { useState, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { ClientListItem } from '../../../../shared/components/ClientListItem';

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return data ?? [];
    const q = searchQuery.toLowerCase();
    return (data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-slate-200"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar por nombre o NIT/RUC"
          placeholder="Buscar por nombre o NIT/RUC"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
      </div>

      <div aria-label="Lista de clientes" className="flex-1 overflow-y-auto">
        {isLoading && (
          <div aria-label="Cargando clientes" className="p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={56} className="mb-2" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          filteredClientes.map((cliente) => (
            <ClientListItem
              key={cliente.id}
              id={cliente.id}
              nombre={cliente.nombre}
              nit={cliente.nit}
              onClick={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
