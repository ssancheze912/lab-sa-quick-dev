import { UserGroupIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message: string
  description?: string
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center h-full px-4 py-8 text-center"
    >
      <UserGroupIcon className="h-12 w-12 text-slate-300 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      )}
    </div>
  )
}
