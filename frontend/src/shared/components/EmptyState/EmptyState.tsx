import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

/**
 * Story 2.1 — EmptyState variants per UX spec.
 *
 * - `no-clients`: shown when the backend returns `[]` (CTA enabled).
 * - `search-empty`: shown when the cache is non-empty but the filter yields zero.
 * - `no-contacts`: placeholder for Epic 3 — not consumed by Story 2.1.
 */
export type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'

export interface EmptyStateProps {
  variant: EmptyStateVariant
  onAction?: () => void
}

interface VariantConfig {
  title: string
  subtitle: string
  ctaLabel?: string
  icon: React.ReactNode
  testId: string
}

const variantConfig: Record<EmptyStateVariant, VariantConfig> = {
  'no-clients': {
    title: 'No hay clientes registrados',
    subtitle: 'Crea el primer cliente del sistema',
    ctaLabel: 'Nuevo cliente',
    icon: <UsersIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />,
    testId: 'empty-state-no-clients',
  },
  'search-empty': {
    title: 'No se encontró ningún cliente',
    subtitle: 'Intenta con otro nombre o NIT',
    icon: <MagnifyingGlassIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />,
    testId: 'empty-state-search-empty',
  },
  'no-contacts': {
    title: 'No hay contactos registrados',
    subtitle: 'Crea el primer contacto del sistema',
    ctaLabel: 'Nuevo contacto',
    icon: <UsersIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />,
    testId: 'empty-state-no-contacts',
  },
}

export function EmptyState({ variant, onAction }: EmptyStateProps): React.ReactElement {
  const config = variantConfig[variant]
  const showCta = Boolean(config.ctaLabel && onAction)

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={config.testId}
      className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    >
      {config.icon}
      <h2 className="text-base font-medium text-slate-900">{config.title}</h2>
      <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      {showCta && config.ctaLabel ? (
        <Button type="outline" onClick={onAction}>
          {config.ctaLabel}
        </Button>
      ) : null}
    </div>
  )
}
