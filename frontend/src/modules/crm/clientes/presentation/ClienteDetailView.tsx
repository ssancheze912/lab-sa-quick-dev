import { useState } from 'react';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'sonner';
import { useCliente } from '../application/useCliente';
import { useDeleteCliente } from '../application/useDeleteCliente';
import { useContactosByCliente } from '../../contactos/application/useContactosByCliente';
import { ContactManager } from '../../shared/components/ContactManager';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { NotFoundPanel } from '../../../../shared/components/NotFoundPanel';
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
} from '../../../../components/ui/alert-dialog';
import type { ClienteFormData } from '../application/clienteSchema';

interface ClienteDetailViewProps {
  clienteId: string | undefined;
  onClienteDeleted?: () => void;
}

export function ClienteDetailView({ clienteId, onClienteDeleted }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId);
  const {
    data: contactos,
    isLoading: isLoadingContactos,
    isError: isErrorContactos,
    refetch: refetchContactos,
  } = useContactosByCliente(clienteId);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteCliente();

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

  const editDefaultValues: ClienteFormData = {
    nombre: data.nombre,
    nit: data.nit,
    telefono: data.telefono,
    ciudad: data.ciudad,
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(data.id, {
      onSuccess: (result) => {
        if (result?.hadContacts) {
          toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.');
        } else {
          toast.success('Cliente eliminado correctamente');
        }
        setIsDeleteDialogOpen(false);
        onClienteDeleted?.();
      },
      onError: () => {
        toast.error('No se pudo eliminar el cliente. Intenta de nuevo.');
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">{data.nombre}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditFormOpen(true)}
            data-testid="btn-editar"
            className="px-3 py-1.5 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid="btn-eliminar"
            aria-label="Eliminar cliente"
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
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

      <div data-testid="contact-manager-section" className="mt-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Contactos asociados
        </h3>
        <ContactManager
          contactos={contactos ?? []}
          isLoading={isLoadingContactos}
          isError={isErrorContactos}
          onRetry={() => refetchContactos()}
        />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="btn-confirm-delete"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar cliente"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <ClienteForm
              clienteId={data.id}
              defaultValues={editDefaultValues}
              onClose={() => setIsEditFormOpen(false)}
              onSuccess={() => refetch()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
