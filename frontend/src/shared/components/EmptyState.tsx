import { UserGroupIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <UserGroupIcon className="w-12 h-12 text-slate-400" aria-hidden="true" />
      <p className="text-slate-500 text-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: '#0e79fd' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
