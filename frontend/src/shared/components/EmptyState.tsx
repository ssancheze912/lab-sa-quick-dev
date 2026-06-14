import { InboxIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message: string
  action?: React.ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <InboxIcon className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
      <p className="text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
