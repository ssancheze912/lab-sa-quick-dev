import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useClientes } from '../application/useClientes';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { ClienteListItem } from '../../../../shared/components/ClienteListItem';
import { sortClientes } from '../../../../shared/lib/sortClientes';
import type { Cliente } from '../domain/Cliente';

interface ClienteListViewProps {
  onClienteSelect?: (cliente: Cliente) => void;
  selectedClienteId?: string;
}

export function ClienteListView({ onClienteSelect, selectedClienteId }: ClienteListViewProps) {
  const { data = [], isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');

  const sortedClientes = useMemo(() => sortClientes(data, 'fecha-desc'), [data]);

  const filteredClientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedClientes;
    return sortedClientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    );
  }, [sortedClientes, searchQuery]);

  return (
    <div data-testid="clientes-list-panel" className="w-[280px] flex flex-col h-full border-r border-slate-200 bg-white shrink-0">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Clientes</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400"
          aria-label="Buscar clientes"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-3 space-y-3" aria-label="Cargando clientes...">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="50%" />
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
          <>
            {filteredClientes.length === 0 ? (
              <EmptyState
                title="Sin resultados"
                description="No se encontraron clientes con ese criterio de búsqueda."
              />
            ) : (
              filteredClientes.map((cliente) => (
                <ClienteListItem
                  key={cliente.id}
                  cliente={cliente}
                  isActive={cliente.id === selectedClienteId}
                  onClick={onClienteSelect}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
