import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Link } from '@tanstack/react-router';
import { useCliente } from '../application/useCliente';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClienteEditForm } from './ClienteEditForm';

interface ClienteDetailViewProps {
  clienteId: string;
}

function ClienteDetailSkeleton() {
  return (
    <section aria-label="Detalle del cliente" data-testid="cliente-detail-skeleton" className="max-w-xl p-6">
      <Skeleton height={28} width="60%" className="mb-4" />
      <div className="space-y-4">
        <div>
          <Skeleton height={12} width="25%" className="mb-1" />
          <Skeleton height={16} width="50%" />
        </div>
        <div>
          <Skeleton height={12} width="25%" className="mb-1" />
          <Skeleton height={16} width="40%" />
        </div>
        <div>
          <Skeleton height={12} width="25%" className="mb-1" />
          <Skeleton height={16} width="35%" />
        </div>
      </div>
    </section>
  );
}

function NotFoundMessage() {
  return (
    <section
      aria-label="Detalle del cliente"
      data-testid="cliente-not-found"
      className="flex flex-col items-center justify-center h-full text-center p-6"
    >
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        No se encontró el cliente solicitado.
      </p>
      <Link
        to="/clientes"
        data-testid="cliente-not-found-back"
        className="mt-4 text-sm text-[#0e79fd] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2 rounded"
      >
        Volver a la lista de clientes
      </Link>
    </section>
  );
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);
  const [isEditing, setIsEditing] = useState(false);

  const isNotFound =
    isError && (error as { response?: { status?: number } })?.response?.status === 404;

  if (isLoading) return <ClienteDetailSkeleton />;
  if (isNotFound) return <NotFoundMessage />;
  if (isError) return <ErrorPanel onRetry={refetch} message="No se pudo cargar el detalle del cliente." />;

  if (!data) return null;

  if (isEditing) {
    return (
      <ClienteEditForm
        cliente={data}
        onSuccess={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <section
      aria-label="Detalle del cliente"
      data-testid="cliente-detail-panel"
      className="max-w-xl p-6"
    >
      <h2 data-testid="cliente-detail-nombre" className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        {data.nombre}
      </h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            NIT/RUC
          </dt>
          <dd data-testid="cliente-detail-nitruc" className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.nitRuc}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Teléfono
          </dt>
          <dd data-testid="cliente-detail-telefono" className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.telefono}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Ciudad
          </dt>
          <dd data-testid="cliente-detail-ciudad" className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.ciudad}
          </dd>
        </div>
      </dl>
    </section>
  );
}
