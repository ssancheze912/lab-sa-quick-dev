import { isAxiosError } from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { useCliente } from '../application/useCliente';

interface ClienteDetailViewProps {
  clienteId: string | undefined;
}

const FIELD_LABELS = ['Nombre', 'NIT/RUC', 'Teléfono', 'Ciudad'] as const;

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

  if (!clienteId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">
          Selecciona un cliente para ver sus detalles.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <section
        aria-label="Detalle del cliente"
        aria-busy="true"
        className="p-6 space-y-4"
      >
        {FIELD_LABELS.map((label) => (
          <div key={label} data-testid="skeleton-row">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <Skeleton height={24} />
          </div>
        ))}
      </section>
    );
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <p role="status" className="text-sm text-slate-500">
            Cliente no encontrado.
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <ErrorPanel onRetry={refetch} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p role="status" className="text-sm text-slate-500">
          Cliente no encontrado.
        </p>
      </div>
    );
  }

  return (
    <section
      data-testid="cliente-detail-panel"
      aria-label="Detalle del cliente"
      className="p-6"
    >
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-[#0e79fd] uppercase tracking-wide mb-1">
            Nombre
          </dt>
          <dd
            className="text-sm text-slate-900"
            aria-label={`Nombre: ${data.nombre}`}
          >
            {data.nombre}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#0e79fd] uppercase tracking-wide mb-1">
            NIT/RUC
          </dt>
          <dd
            className="text-sm text-slate-900"
            aria-label={`NIT/RUC: ${data.nit}`}
          >
            {data.nit}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#0e79fd] uppercase tracking-wide mb-1">
            Teléfono
          </dt>
          <dd
            className="text-sm text-slate-900"
            aria-label={`Teléfono: ${data.telefono}`}
          >
            {data.telefono}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#0e79fd] uppercase tracking-wide mb-1">
            Ciudad
          </dt>
          <dd
            className="text-sm text-slate-900"
            aria-label={`Ciudad: ${data.ciudad}`}
          >
            {data.ciudad}
          </dd>
        </div>
      </dl>
    </section>
  );
}
