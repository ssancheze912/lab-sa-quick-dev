import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useCliente } from '../application/useCliente';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { NotFoundPanel } from '../../../../shared/components/NotFoundPanel';

interface ClienteDetailViewProps {
  clienteId: string | undefined;
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

  const isNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404;

  if (!clienteId) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex items-center justify-center text-slate-400 text-sm"
      >
        Selecciona un cliente para ver su detalle
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 p-6"
      >
        <Skeleton height={28} width="60%" className="mb-4" />
        <Skeleton height={16} width="40%" className="mb-2" />
        <Skeleton height={16} width="40%" className="mb-2" />
        <Skeleton height={16} width="40%" className="mb-2" />
        <Skeleton height={16} width="40%" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div data-testid="cliente-detail-panel" className="flex-1">
        <NotFoundPanel
          title="Cliente no encontrado"
          description="El cliente solicitado no existe o fue eliminado."
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="cliente-detail-panel" className="flex-1">
        <ErrorPanel onRetry={() => refetch()} message="No se pudo cargar el cliente." />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{data.nombre}</h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="mt-1 text-sm text-slate-900">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="mt-1 text-sm text-slate-900">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="mt-1 text-sm text-slate-900">{data.ciudad}</dd>
        </div>
      </dl>
    </div>
  );
}
