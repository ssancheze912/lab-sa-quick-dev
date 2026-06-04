import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ClientListItem } from '../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { useClientes } from '../application/useClientes';

interface ClienteListViewProps {
  selectedId?: string;
  onClienteSelect?: (id: string) => void;
}

export function ClienteListView({ selectedId, onClienteSelect }: ClienteListViewProps) {
  const { data, isLoading, isError, refetch } = useClientes();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClientes = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <div
        data-testid="clientes-loading-skeleton"
        className="w-[280px] flex flex-col gap-2 p-3"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={56} borderRadius={8} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="clientes-list-panel"
        className="w-[280px] min-h-screen border-r border-slate-200"
      >
        <ErrorPanel onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] min-h-screen border-r border-slate-200 flex flex-col overflow-hidden"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          type="search"
          data-testid="search-clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
      </div>
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Lista de clientes">
        {data?.length === 0 ? (
          <EmptyState
            message="No hay clientes registrados"
            description="Crea el primer cliente para comenzar"
          />
        ) : filteredClientes.length === 0 ? (
          <EmptyState message="Sin resultados" description="No se encontraron clientes con ese criterio" />
        ) : (
          filteredClientes.map((cliente) => (
            <div key={cliente.id} role="listitem" data-testid="cliente-list-item">
              <ClientListItem
                cliente={cliente}
                isSelected={selectedId === cliente.id}
                onClick={() => onClienteSelect?.(cliente.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
