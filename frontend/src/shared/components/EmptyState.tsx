import { UserGroupIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'No hay clientes aún. Crea el primero.' }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500"
    >
      <UserGroupIcon className="w-12 h-12 mb-3 text-slate-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
