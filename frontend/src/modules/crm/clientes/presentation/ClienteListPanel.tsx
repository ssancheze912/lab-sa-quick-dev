import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from 'siesa-ui-kit';
import { ClientListItem } from '../../../../shared/components/ClientListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { useClientes } from '../application/useClientes';

export function ClienteListPanel() {
  const { data, isLoading, isError, refetch } = useClientes();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data ?? [];
    const q = search.toLowerCase();
    return (data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <aside
      className="flex flex-col w-[280px] min-h-full border-r border-slate-200 bg-white"
      aria-label="Lista de clientes"
    >
      <div className="p-3 border-b border-slate-200">
        <Input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />}
          inputSize="sm"
          aria-label="Buscar clientes"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-3" aria-label="Cargando clientes">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-3">
                <Skeleton height={14} width="80%" className="mb-1" />
                <Skeleton height={12} width="50%" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel
            message="Error al cargar los clientes"
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title="No hay clientes registrados"
            description="Crear el primer cliente"
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul role="list" aria-label="Clientes">
            {filtered.map((cliente) => (
              <li key={cliente.id}>
                <ClientListItem cliente={cliente} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
