interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500"
      data-testid="cliente-empty-state"
    >
      <p className="text-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
