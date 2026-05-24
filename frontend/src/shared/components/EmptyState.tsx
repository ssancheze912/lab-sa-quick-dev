import { UsersIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({
  message = 'Aún no hay clientes registrados. Crea el primero.',
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center p-6 text-center"
    >
      <UsersIcon className="w-10 h-10 text-slate-300 mb-3" aria-hidden="true" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}
