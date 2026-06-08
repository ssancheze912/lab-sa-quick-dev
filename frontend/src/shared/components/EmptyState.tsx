import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

/**
 * Story 2.1: EmptyState shared component
 *
 * Variants:
 *   - `no-clients`   → AC #6: GET returned [] (initial empty list)
 *   - `search-empty` → AC #7: filter yields zero results
 *   - `no-contacts`  → reserved for Story 4.x (Contactos epic)
 *
 * Accessibility (AC #7, #11):
 *   - Root carries `role="status"` + `aria-live="polite"` so AT users get
 *     announced when the EmptyState appears.
 *
 * CTA behavior:
 *   - The button only renders when `onCtaClick` is provided; in Story 2.1
 *     the parent omits it (placeholder) — Story 2.3 will wire it to the
 *     create-client flow.
 */
export type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'

interface EmptyStateCopy {
  title: string
  subtitle: string
  ctaLabel: string
  Icon: typeof UsersIcon
}

const COPY: Record<EmptyStateVariant, EmptyStateCopy> = {
  'no-clients': {
    title: 'No hay clientes registrados',
    subtitle: 'Crea el primer cliente del sistema',
    ctaLabel: 'Nuevo cliente',
    Icon: UsersIcon,
  },
  'search-empty': {
    title: 'No se encontró ningún cliente',
    subtitle: 'Intenta con otro nombre o NIT',
    ctaLabel: 'Crear cliente',
    Icon: MagnifyingGlassIcon,
  },
  'no-contacts': {
    title: 'No hay contactos registrados',
    subtitle: 'Crea el primer contacto del sistema',
    ctaLabel: 'Nuevo contacto',
    Icon: UserCircleIcon,
  },
}

interface EmptyStateProps {
  variant: EmptyStateVariant
  onCtaClick?: () => void
}

export function EmptyState({ variant, onCtaClick }: EmptyStateProps) {
  const { title, subtitle, ctaLabel, Icon } = COPY[variant]

  return (
    <section
      role="status"
      aria-live="polite"
      data-testid="empty-state"
      data-variant={variant}
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <Icon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
      {onCtaClick ? (
        <Button type="outline" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      ) : null}
    </section>
  )
}
