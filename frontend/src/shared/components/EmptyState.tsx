interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      role="status"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <p className="text-slate-700 font-medium">{message}</p>
      {hint && <p className="text-slate-500 text-sm mt-1">{hint}</p>}
    </div>
  )
}
