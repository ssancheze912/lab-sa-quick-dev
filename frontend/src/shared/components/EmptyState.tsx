import { InboxIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export type EmptyStateVariant = 'default' | 'search-empty' | 'no-clients'

interface EmptyStateProps {
  title: string
  description?: string
  testId?: string
  variant?: EmptyStateVariant
}

/**
 * Spanish-content empty state panel. Icon is chosen from the variant.
 * Callers MUST provide the Spanish copy (title / description).
 */
export function EmptyState({
  title,
  description,
  testId,
  variant = 'default',
}: EmptyStateProps) {
  const Icon = variant === 'search-empty' ? MagnifyingGlassIcon : InboxIcon

  return (
    <div
      data-testid={testId}
      role="status"
      className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center"
    >
      <Icon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description ? (
        <p className="text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}
