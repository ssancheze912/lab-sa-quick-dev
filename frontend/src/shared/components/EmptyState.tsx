interface EmptyStateProps {
  title: string
  description?: string
}

/**
 * Shared placeholder for empty collections. Rendered when a query resolves
 * with a zero-length array (no rows to display). Copy is passed in as Spanish
 * strings by the caller.
 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
  )
}
