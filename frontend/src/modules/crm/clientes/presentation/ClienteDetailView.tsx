import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { AxiosError } from 'axios';
import { useCliente } from '../application/useCliente';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

interface ClienteDetailViewProps {
  clienteId: string;
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 p-6"
      >
        <div className="max-w-lg space-y-4">
          <Skeleton height={28} width="60%" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton height={12} width="30%" className="mb-1" />
                <Skeleton height={18} width="70%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const axiosError = error as AxiosError;
    const is404 = axiosError?.response?.status === 404;

    if (is404) {
      return (
        <div
          data-testid="cliente-detail-panel"
          className="flex-1 flex items-center justify-center p-6"
        >
          <p className="text-slate-500 text-sm">Cliente no encontrado.</p>
        </div>
      );
    }

    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex items-center justify-center p-6"
      >
        <ErrorPanel
          onRetry={() => void refetch()}
          message="No se pudo cargar el cliente. Intenta de nuevo."
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex items-center justify-center p-6"
      >
        <p className="text-slate-400 text-sm">Selecciona un cliente para ver sus detalles.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="cliente-detail-panel"
      className="flex-1 p-6"
    >
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{data.nombre}</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
            <dd className="mt-1 text-sm text-slate-900">{data.nombre}</dd>
          </div>
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
    </div>
  );
}
