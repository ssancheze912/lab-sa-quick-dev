import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useCliente } from '../application/useCliente';

interface ClienteDetailViewProps {
  clienteId: string;
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError } = useCliente(clienteId);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-3" data-testid="cliente-detail-loading">
        <Skeleton height={24} width="60%" />
        <Skeleton height={20} width="40%" />
        <Skeleton height={20} width="50%" />
        <Skeleton height={20} width="35%" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="cliente-not-found"
        className="flex h-full items-center justify-center text-slate-500 text-sm"
        role="status"
      >
        Cliente no encontrado
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="cliente-detail-panel" className="p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre</p>
        <span data-testid="cliente-nombre" className="text-base font-medium text-slate-900">
          {data.nombre}
        </span>
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">NIT/RUC</p>
        <span data-testid="cliente-nit" className="text-base text-slate-700">
          {data.nit}
        </span>
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Teléfono</p>
        <span data-testid="cliente-telefono" className="text-base text-slate-700">
          {data.telefono}
        </span>
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Ciudad</p>
        <span data-testid="cliente-ciudad" className="text-base text-slate-700">
          {data.ciudad}
        </span>
      </div>
    </div>
  );
}
