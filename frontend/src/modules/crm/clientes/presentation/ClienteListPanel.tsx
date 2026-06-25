import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClientListItem } from '@/shared/components/ClientListItem';
import { SortControl } from '@/shared/components/SortControl';
import type { SortOption } from '@/shared/components/SortControl';

interface ClienteListPanelProps {
  activeClienteId?: string;
  onClienteSelect?: (id: string) => void;
}

export function ClienteListPanel({ activeClienteId, onClienteSelect }: ClienteListPanelProps = {}) {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption>('fecha-desc');

  const filteredAndSorted = useMemo(() => {
    const filtered =
      data?.filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nit.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ?? [];

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre, 'es');
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre, 'es');
        case 'fecha-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'fecha-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [data, searchQuery, sortOrder]);

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

      {/* Sort control */}
      <div className="px-3 py-2 border-b border-slate-100">
        <SortControl value={sortOrder} onChange={setSortOrder} />
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

        {!isLoading && !isError && filteredAndSorted.length > 0 && (
          <ul role="listbox" aria-label="Lista de clientes" className="space-y-0.5">
            {filteredAndSorted.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isActive={activeClienteId === cliente.id}
                onClick={() => onClienteSelect?.(cliente.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
