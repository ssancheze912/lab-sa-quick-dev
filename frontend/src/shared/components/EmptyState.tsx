interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      data-testid="clientes-empty-state"
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}
