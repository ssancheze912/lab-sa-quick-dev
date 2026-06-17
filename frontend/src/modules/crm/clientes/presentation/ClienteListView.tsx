import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClientListItem } from '@/shared/components/ClientListItem';

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError, refetch } = useClientes();

  const filteredClientes = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nitRuc.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  return (
    <div className="flex flex-col w-[280px] h-full border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          aria-label="Buscar cliente"
          placeholder="Buscar por nombre o NIT/RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0e79fd] focus:outline-none focus:ring-1 focus:ring-[#0e79fd] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="50%" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={refetch} />
        )}

        {!isLoading && !isError && data?.length === 0 && !searchQuery && (
          <EmptyState message="No hay clientes registrados. Crea el primero." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredClientes.map((cliente) => (
              <ClientListItem key={cliente.id} cliente={cliente} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
