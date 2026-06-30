import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center p-6 text-center text-slate-500"
      role="status"
      aria-label="Estado vacío"
    >
      <ClipboardDocumentListIcon className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
