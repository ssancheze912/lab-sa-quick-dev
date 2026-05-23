interface EmptyStateProps {
  message: string
  action?: React.ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      role="status"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500 dark:text-slate-400"
    >
      <p className="text-sm">{message}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
