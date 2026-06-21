import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { filterClientes } from '../application/filterClientes';
import { ClientListItem } from '@/shared/components/ClientListItem';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorPanel } from '@/shared/components/ErrorPanel';

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clientes, isLoading, isError, refetch } = useClientes();

  const filteredClientes = useMemo(
    () => filterClientes(clientes ?? [], searchQuery),
    [clientes, searchQuery]
  );

  return (
    <div className="w-[280px] flex flex-col h-full border-r border-slate-200 bg-white">
      <div className="p-3 border-b border-slate-100">
        <input
          data-testid="search-input"
          type="text"
          aria-label="Buscar clientes por nombre o NIT/RUC"
          placeholder="Buscar por nombre o NIT/RUC…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} data-testid="skeleton-row" className="px-1">
                <Skeleton height={20} className="mb-1" />
                <Skeleton height={14} width="60%" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState message="No hay clientes aún. Crea el primer cliente." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="list" aria-label="Lista de clientes">
            {filteredClientes.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                id={cliente.id}
                nombre={cliente.nombre}
                nit={cliente.nit}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
