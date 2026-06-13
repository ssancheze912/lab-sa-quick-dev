import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { ClientListItem } from '../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

export function ClienteListPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clientes, isLoading, isError, refetch } = useClientes();

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes ?? [];
    const q = searchQuery.toLowerCase();
    return (clientes ?? []).filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
    );
  }, [clientes, searchQuery]);

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] shrink-0 flex flex-col h-full border-r border-slate-200 bg-white"
    >
      <div className="p-3 border-b border-slate-100">
        <input
          data-testid="clientes-search-input"
          type="text"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre o NIT/RUC"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div data-testid="clientes-list-skeleton" className="p-3 flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-2">
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="50%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState
            message="No hay clientes registrados. Crea el primero."
            ctaLabel="Crear cliente"
          />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul>
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <ClientListItem nombre={cliente.nombre} nit={cliente.nit} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
