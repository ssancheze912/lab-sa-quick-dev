import type { ReactNode } from 'react'
import { Button } from 'siesa-ui-kit'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  ctaLabel?: string
  onCtaClick?: () => void
  'data-testid'?: string
}

/**
 * Generic empty-state panel used across modules (Story 2.1 — Clientes,
 * Story 3.1 — Contactos). Copy is driven 100% by props so no module-specific
 * logic ever leaks in.
 *
 * Accessibility: announced as a polite live region (`role="status"`).
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  'data-testid': dataTestId = 'empty-state',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div className="text-slate-300">{icon}</div>
      <h2 className="text-base font-semibold text-slate-700">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {ctaLabel && (
        <Button type="default" size="sm" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
