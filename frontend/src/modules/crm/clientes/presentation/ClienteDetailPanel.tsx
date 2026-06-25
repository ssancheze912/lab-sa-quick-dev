import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'siesa-ui-kit';
import { useCliente } from '../application/useCliente';
import { useDeleteCliente } from '../application/useDeleteCliente';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { ClienteForm } from './ClienteForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClienteDetailPanelProps {
  clienteId: string | undefined;
}

function SkeletonDetail() {
  return (
    <div data-testid="cliente-detail-skeleton" className="p-6 space-y-5">
      <div>
        <Skeleton height={12} width="30%" className="mb-1" />
        <Skeleton height={20} width="70%" />
      </div>
      <div>
        <Skeleton height={12} width="30%" className="mb-1" />
        <Skeleton height={20} width="55%" />
      </div>
      <div>
        <Skeleton height={12} width="30%" className="mb-1" />
        <Skeleton height={20} width="50%" />
      </div>
      <div>
        <Skeleton height={12} width="30%" className="mb-1" />
        <Skeleton height={20} width="40%" />
      </div>
    </div>
  );
}

export function ClienteDetailPanel({ clienteId }: ClienteDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);
  const deleteCliente = useDeleteCliente();
  const navigate = useNavigate();

  // Placeholder — no client selected
  if (!clienteId) {
    return (
      <div
        aria-label="Panel de detalle del cliente"
        className="flex flex-1 items-center justify-center text-slate-400 text-sm"
      >
        <p data-testid="cliente-detail-placeholder">
          Selecciona un cliente para ver el detalle
        </p>
      </div>
    );
  }

  // Loading state — skeleton screen
  if (isLoading) {
    return (
      <div
        aria-label="Panel de detalle del cliente"
        className="flex-1 overflow-y-auto"
      >
        <SkeletonDetail />
      </div>
    );
  }

  // 404 — client not found (distinct from generic error)
  const is404 = isError && axios.isAxiosError(error) && error.response?.status === 404;
  if (is404) {
    return (
      <div
        aria-label="Panel de detalle del cliente"
        className="flex flex-1 items-center justify-center flex-col gap-3 text-center px-6"
      >
        <ExclamationCircleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p
          data-testid="cliente-not-found"
          aria-live="polite"
          className="text-sm text-slate-500"
        >
          Cliente no encontrado
        </p>
      </div>
    );
  }

  // Generic error — 5xx or network failure
  if (isError) {
    return (
      <div
        aria-label="Panel de detalle del cliente"
        className="flex flex-1 items-center justify-center"
      >
        <ErrorPanel onRetry={refetch} />
      </div>
    );
  }

  // Edit mode — show ClienteForm with pre-filled data
  if (isEditing && data) {
    return (
      <div
        aria-label="Panel de detalle del cliente"
        className="flex-1 overflow-y-auto"
      >
        <ClienteForm
          mode="edit"
          clienteId={clienteId}
          initialData={{
            nombre: data.nombre,
            nit: data.nit,
            telefono: data.telefono,
            ciudad: data.ciudad,
          }}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  function handleConfirmDelete() {
    if (!clienteId) return;

    // Check cache for associated contacts to decide which toast to show
    // (per story 2.5 dev notes — cache-based approach)
    deleteCliente.mutate(clienteId, {
      onSuccess: () => {
        navigate({ to: '/clientes' });
        toast.success('Cliente eliminado correctamente');
      },
      onError: () => {
        toast.error('No se pudo eliminar el cliente. Intenta de nuevo.');
      },
    });
  }

  // Success — render client fields
  return (
    <div
      aria-label="Panel de detalle del cliente"
      className="flex-1 overflow-y-auto p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900">Detalle del cliente</h3>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  data-testid="cliente-eliminar-button"
                  type="button"
                  aria-label="Eliminar cliente"
                  className="rounded-md border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Eliminar
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="delete-confirmation-dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle data-testid="delete-dialog-title">¿Eliminar este cliente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-testid="delete-dialog-cancel"
                    aria-label="Cancelar eliminación"
                    className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="delete-dialog-confirm"
                    aria-label="Confirmar eliminación"
                    disabled={deleteCliente.isPending}
                    onClick={handleConfirmDelete}
                    className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteCliente.isPending ? 'Eliminando…' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <button
            data-testid="cliente-editar-button"
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Editar cliente"
            className="rounded-md bg-[#0e79fd] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          >
            Editar
          </button>
        </div>
      </div>

      <dl
        data-testid="cliente-detail-content"
        className="space-y-5"
      >
        <div>
          <dt className="text-xs font-light text-slate-500 uppercase tracking-wide">
            Nombre
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-900">
            {data?.nombre}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-light text-slate-500 uppercase tracking-wide">
            NIT/RUC
          </dt>
          <dd className="mt-1 text-sm font-normal text-slate-700">
            {data?.nit}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-light text-slate-500 uppercase tracking-wide">
            Teléfono
          </dt>
          <dd className="mt-1 text-sm font-normal text-slate-700">
            {data?.telefono}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-light text-slate-500 uppercase tracking-wide">
            Ciudad
          </dt>
          <dd className="mt-1 text-sm font-normal text-slate-700">
            {data?.ciudad}
          </dd>
        </div>
      </dl>
    </div>
  );
}
