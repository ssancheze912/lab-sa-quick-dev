import { useState, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Link } from '@tanstack/react-router';
import { useClientes } from '../application/useClientes';
import { filterClientes } from '../application/filterClientes';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(
    () => filterClientes(data ?? [], searchQuery),
    [data, searchQuery],
  );

  const searchInput = (
    <div className="p-3 border-b border-slate-200">
      <input
        type="search"
        role="searchbox"
        aria-label="Buscar clientes"
        placeholder="Buscar por nombre o NIT/RUC..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-slate-200 bg-white">
        {searchInput}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-2">
              <Skeleton height={16} className="mb-1" />
              <Skeleton height={12} width="60%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-slate-200 bg-white">
        {searchInput}
        <div className="flex-1 overflow-y-auto">
          <ErrorPanel onRetry={() => void refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-slate-200 bg-white"
    >
      {searchInput}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ul>
            {filtered.map((cliente) => (
              <li
                key={cliente.id}
                data-testid="cliente-list-item"
              >
                <Link
                  to="/clientes/$clienteId"
                  params={{ clienteId: cliente.id }}
                  className="block px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  activeProps={{ className: 'block px-4 py-3 border-b border-slate-100 bg-blue-50 cursor-pointer' }}
                >
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {cliente.nombre}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
