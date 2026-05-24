// Story 2.1: Client List & Search
// Shared component: EmptyState

import { UsersIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center h-full gap-3 px-4 py-8 text-center"
    >
      <UsersIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {description && (
        <p className="text-xs text-slate-400">{description}</p>
      )}
      {action}
    </div>
  )
}
