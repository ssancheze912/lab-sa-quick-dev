import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useContacto } from '../application/useContacto';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';
import { NotFoundPanel } from '../../../../shared/components/NotFoundPanel';

interface ContactoDetailViewProps {
  contactoId: string;
}

export function ContactoDetailView({ contactoId }: ContactoDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useContacto(contactoId);

  const isNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404;

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
    </div>
  );
}
