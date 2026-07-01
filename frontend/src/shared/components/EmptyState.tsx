import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'

export type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'

interface EmptyStateProps {
  variant: EmptyStateVariant
  testId?: string
}

interface VariantConfig {
  title: string
  subtitle: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  defaultTestId: string
}

const VARIANTS: Record<EmptyStateVariant, VariantConfig> = {
  'no-clients': {
    title: 'No hay clientes registrados',
    subtitle: 'Crea el primer cliente del sistema',
    Icon: UserPlusIcon,
    defaultTestId: 'empty-state-no-clients',
  },
  'search-empty': {
    title: 'No se encontró ningún cliente',
    subtitle: 'Intenta con otro nombre o NIT',
    Icon: MagnifyingGlassIcon,
    defaultTestId: 'empty-state-search-empty',
  },
  'no-contacts': {
    title: 'Este cliente no tiene contactos',
    subtitle: 'Agrega el primer contacto para este cliente',
    Icon: UsersIcon,
    defaultTestId: 'empty-state-no-contacts',
  },
}

/**
 * Empty-state placeholder — Story 2.1 AC #3 / #4.
 *
 * Announces itself politely to screen readers via `role="status"` + `aria-live="polite"`
 * so state changes (e.g. search filters clearing the list) are perceivable.
 * No CTA in the initial variants — the "Nuevo cliente" CTA arrives with Story 2.3.
 */
export function EmptyState({ variant, testId }: EmptyStateProps) {
  const { title, subtitle, Icon, defaultTestId } = VARIANTS[variant]
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId ?? defaultTestId}
      className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <Icon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}
