import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useContacto } from '../application/useContacto';
import { useDeleteContacto } from '../application/useDeleteContacto';
import { ContactoForm } from './ContactoForm';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { NotFoundPanel } from '../../../../shared/components/NotFoundPanel';

interface ContactoDetailViewProps {
  contactoId: string;
  onContactoDeleted?: () => void;
}

export function ContactoDetailView({ contactoId, onContactoDeleted }: ContactoDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useContacto(contactoId);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteContacto();

  const isNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404;

  const handleConfirmDelete = () => {
    deleteMutation.mutate(contactoId, {
      onSuccess: () => {
        toast.success('Contacto eliminado correctamente');
        setIsDeleteDialogOpen(false);
        onContactoDeleted?.();
      },
      onError: () => {
        toast.error('No se pudo eliminar el contacto. Intenta de nuevo.');
        setIsDeleteDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton count={4} height={32} className="mb-2" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <NotFoundPanel
        title="Contacto no encontrado"
        description="El contacto solicitado no existe o fue eliminado."
      />
    );
  }

  if (isError) {
    return (
      <ErrorPanel
        onRetry={refetch}
        message="No se pudo cargar el contacto."
      />
    );
  }

  return (
    <>
      <div data-testid="contacto-detail-view" className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{data!.nombre}</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cargo</dt>
            <dd className="text-sm text-slate-900 mt-0.5">{data!.cargo}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
            <dd className="text-sm text-slate-900 mt-0.5">{data!.telefono}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
            <dd className="text-sm text-slate-900 mt-0.5">{data!.email}</dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsEditFormOpen(true)}
            data-testid="btn-editar"
            className="rounded bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9]"
          >
            Editar
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid="btn-eliminar"
            aria-label="Eliminar contacto"
            className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>
      {isEditFormOpen && (
        <div role="dialog" aria-modal="true" aria-label="Editar contacto">
          <ContactoForm
            contactoId={data!.id}
            defaultValues={{
              nombre: data!.nombre,
              cargo: data!.cargo,
              telefono: data!.telefono,
              email: data!.email,
            }}
            onClose={() => setIsEditFormOpen(false)}
            onSuccess={() => refetch()}
          />
        </div>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este contacto?</AlertDialogTitle>
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
    </>
  );
}
