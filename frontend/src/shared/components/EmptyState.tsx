import type { ReactNode } from 'react'
import { UsersIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title = 'No hay clientes registrados',
  description = 'Crea el primer cliente para comenzar.',
  action,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <UsersIcon className="w-10 h-10 text-slate-300" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
