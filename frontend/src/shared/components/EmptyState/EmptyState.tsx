import type { ReactNode } from 'react'
import { MagnifyingGlassIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

export type EmptyStateVariant = 'search-empty' | 'no-clients' | 'no-contacts'

export interface EmptyStateCta {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  variant: EmptyStateVariant
  title: string
  subtitle?: string
  icon?: ReactNode
  cta?: EmptyStateCta
}

const DEFAULT_ICONS: Record<EmptyStateVariant, ReactNode> = {
  'search-empty': <MagnifyingGlassIcon className="size-10 text-slate-400" aria-hidden="true" />,
  'no-clients': <UserGroupIcon className="size-10 text-slate-400" aria-hidden="true" />,
  'no-contacts': <UsersIcon className="size-10 text-slate-400" aria-hidden="true" />,
}

/**
 * Empty-state placeholder rendered in place of a list when there is nothing to
 * display. Supports variants for the different "no data" flavours in the CRM.
 * Announces to screen readers via aria-live="polite".
 */
export function EmptyState({
  variant,
  title,
  subtitle,
  icon,
  cta,
}: EmptyStateProps) {
  const resolvedIcon = icon ?? DEFAULT_ICONS[variant]

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={`empty-state-${variant}`}
      className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
        {resolvedIcon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle ? (
        <p className="text-sm text-slate-500">{subtitle}</p>
      ) : null}
      {cta ? (
        <div className="mt-2">
          <Button type="default" size="base" onClick={cta.onClick}>
            {cta.label}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
