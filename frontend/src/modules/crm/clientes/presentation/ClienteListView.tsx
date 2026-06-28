import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { sortClientes } from '../../../../shared/lib/sortClientes';
import { ClienteListItem } from '../../../../shared/components/ClienteListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

export function ClienteListView() {
  const { data = [], isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');

  const sortedClientes = useMemo(() => sortClientes(data, 'fecha-desc'), [data]);

  const filteredClientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedClientes;
    return sortedClientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    );
  }, [sortedClientes, searchQuery]);

  return (
    <div className="w-[280px] flex flex-col h-full border-r border-slate-200 shrink-0">
      {/* Header */}
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-base font-bold text-slate-800 mb-2">Clientes</h2>
        <input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0e79fd] bg-white"
          aria-label="Buscar clientes"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading && (
          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-3 py-2">
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="60%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && data.length === 0 && (
          <EmptyState
            title="Sin clientes"
            description="Crea el primer cliente para comenzar."
          />
        )}

        {!isLoading && !isError && data.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-1">
            {filteredClientes.map((cliente) => (
              <ClienteListItem key={cliente.id} cliente={cliente} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
