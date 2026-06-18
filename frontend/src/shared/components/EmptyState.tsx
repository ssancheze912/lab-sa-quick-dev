import { UsersIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({
  message = 'No hay clientes registrados. Crea el primero.',
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <UsersIcon className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
