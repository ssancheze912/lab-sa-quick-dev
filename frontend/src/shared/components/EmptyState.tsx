import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  testId?: string
}

/**
 * Genuine custom component — no exported `EmptyState` exists in the installed
 * siesa-ui-kit's public API (confirmed in Story 1.2's Dev Notes/Completion Notes;
 * the package's internal `EmptyState` is unexported/private to `MasterPatternView`).
 */
export function EmptyState({ title, subtitle, icon, testId = 'empty-state' }: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-2 p-6 text-center"
    >
      {icon}
      <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}
