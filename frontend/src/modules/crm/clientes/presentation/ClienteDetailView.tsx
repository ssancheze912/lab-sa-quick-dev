import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useCliente } from '../application/useCliente';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClienteEditForm } from './ClienteEditForm';

interface ClienteDetailViewProps {
  clienteId: string;
}

function ClienteDetailSkeleton() {
  return (
    <section aria-label="Detalle del cliente" className="max-w-xl p-6">
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
      className="flex flex-col items-center justify-center h-full text-center p-6"
    >
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        No se encontró el cliente solicitado.
      </p>
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
      className="max-w-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {data.nombre}
        </h2>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label="Editar cliente"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] dark:bg-[#0e79fd] dark:hover:bg-[#154ca9]"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            NIT/RUC
          </dt>
          <dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.nitRuc}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Teléfono
          </dt>
          <dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.telefono}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Ciudad
          </dt>
          <dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">
            {data.ciudad}
          </dd>
        </div>
      </dl>
    </section>
  );
}
