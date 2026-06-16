import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ClientListItem } from '../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { useClientes } from '../application/useClientes';

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  return (
    <div
      data-testid="clientes-list-panel"
      aria-busy={isLoading ? 'true' : undefined}
      className="w-[280px] h-full flex flex-col border-r border-slate-200 bg-white"
      style={{ width: 280, minWidth: 280, maxWidth: 280 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-800">Clientes</h2>
        <input
          data-testid="search-clientes"
          type="search"
          placeholder="Buscar por nombre o NIT/RUC..."
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder-slate-400"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-3 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="50%" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <EmptyState message="No hay clientes registrados. Crea el primero." />
        )}

        {!isLoading && !isError && data && data.length > 0 && filtered.length === 0 && searchQuery.trim() !== '' && (
          <p
            data-testid="no-results-message"
            className="px-4 py-6 text-sm text-slate-500 text-center"
          >
            Sin resultados para &apos;{searchQuery}&apos;
          </p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul aria-label="Lista de clientes">
            {filtered.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={selectedId === cliente.id}
                onClick={() => setSelectedId(cliente.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
