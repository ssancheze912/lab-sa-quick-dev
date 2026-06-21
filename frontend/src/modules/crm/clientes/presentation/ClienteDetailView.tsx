import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { AxiosError } from 'axios';
import { useCliente } from '../application/useCliente';
import { ErrorPanel } from '@/shared/components/ErrorPanel';

interface ClienteDetailViewProps {
  clienteId: string | undefined;
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

  const isNotFound =
    isError && (error as AxiosError)?.response?.status === 404;

  if (!clienteId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <p className="text-sm text-slate-400">
          Selecciona un cliente de la lista para ver su detalle.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-white" data-testid="skeleton-detail">
        <Skeleton height={28} width="60%" className="mb-4" />
        <Skeleton height={18} className="mb-2" />
        <Skeleton height={18} className="mb-2" />
        <Skeleton height={18} className="mb-2" />
        <Skeleton height={18} width="80%" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <p className="text-sm text-slate-600">Cliente no encontrado.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-6 bg-white">
        <ErrorPanel onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto" data-testid="cliente-detail-panel">
      <h2
        className="text-xl font-bold text-slate-900 mb-6"
        data-testid="cliente-detail-nombre"
      >
        {data!.nombre}
      </h2>

      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            NIT/RUC
          </dt>
          <dd className="mt-1 text-sm text-slate-800" data-testid="cliente-detail-nit">
            {data!.nit}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Teléfono
          </dt>
          <dd className="mt-1 text-sm text-slate-800" data-testid="cliente-detail-telefono">
            {data!.telefono}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Ciudad
          </dt>
          <dd className="mt-1 text-sm text-slate-800" data-testid="cliente-detail-ciudad">
            {data!.ciudad}
          </dd>
        </div>
      </dl>
    </div>
  );
}
