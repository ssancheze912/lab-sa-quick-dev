import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

export type EmptyStateVariant = 'search-empty' | 'no-clients' | 'no-contacts'

export interface EmptyStateProps {
  variant: EmptyStateVariant
  title?: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

interface VariantContent {
  title: string
  subtitle: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const VARIANTS: Record<EmptyStateVariant, VariantContent> = {
  'search-empty': {
    title: 'No se encontró ningún cliente',
    subtitle: 'Intenta con otro nombre o NIT',
    icon: MagnifyingGlassIcon,
  },
  'no-clients': {
    title: 'No hay clientes registrados',
    subtitle: 'Crea el primer cliente del sistema',
    icon: UsersIcon,
  },
  'no-contacts': {
    title: 'No hay contactos asociados',
    subtitle: 'Agrega el primer contacto',
    icon: UserGroupIcon,
  },
}

/**
 * Empty-state placeholder used across CRUD lists (Story 2.1).
 * Variants own the default Spanish copy; consumers may override title/subtitle.
 *
 * `role="status"` + `aria-live="polite"` announce dynamic replacement of a
 * result set to assistive technology.
 */
export function EmptyState({
  variant,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const content = VARIANTS[variant]
  const Icon = content.icon
  const displayTitle = title ?? content.title
  const displaySubtitle = subtitle ?? content.subtitle

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <Icon aria-hidden="true" className="h-10 w-10 text-slate-400" />
      <p className="text-sm font-medium text-slate-900">{displayTitle}</p>
      <p className="text-xs text-slate-500">{displaySubtitle}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button type="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
