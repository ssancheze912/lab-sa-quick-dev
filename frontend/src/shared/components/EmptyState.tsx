interface EmptyStateProps {
  message: string
  testId?: string
}

export function EmptyState({ message, testId = 'empty-state' }: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}
