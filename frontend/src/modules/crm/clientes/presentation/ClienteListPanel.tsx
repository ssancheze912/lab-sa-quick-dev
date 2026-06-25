import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClientListItem } from '@/shared/components/ClientListItem';

export function ClienteListPanel() {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      data?.filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nit.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ?? [],
    [data, searchQuery],
  );

  return (
    <div
      data-testid="clientes-list-panel"
      className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      {/* Search input */}
      <div className="p-3 border-b border-slate-100">
        <input
          data-testid="clientes-search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC..."
          aria-label="Buscar cliente por nombre o NIT/RUC"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
        />
      </div>

      {/* List area */}
      <div data-testid="clientes-list-container" className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="space-y-2 px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-md p-2">
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="50%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={refetch} />
        )}

        {!isLoading && !isError && data !== undefined && data.length === 0 && (
          <EmptyState message="No hay clientes registrados. Crea el primer cliente." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul role="listbox" aria-label="Lista de clientes" className="space-y-0.5">
            {filtered.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isActive={activeId === cliente.id}
                onClick={() => setActiveId(cliente.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
