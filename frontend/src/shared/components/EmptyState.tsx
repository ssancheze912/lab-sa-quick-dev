// EmptyState — custom component (siesa-ui-kit has no equivalent)
// Decision logged: checked siesa-ui-kit catalog, no EmptyState component found.
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full px-4 py-8 text-center"
      data-testid="empty-state"
    >
      <div className="text-slate-400 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
