import { InboxIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message: string
  'aria-label'?: string
}

export function EmptyState({ message, 'aria-label': ariaLabel }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      aria-label={ariaLabel}
      className="flex flex-col items-center justify-center py-12 text-slate-500"
    >
      <InboxIcon className="h-12 w-12 mb-3 text-slate-400" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
