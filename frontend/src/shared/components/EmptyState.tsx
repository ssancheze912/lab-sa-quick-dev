import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'

interface EmptyStateProps {
  variant: EmptyStateVariant
}

const VARIANT_CONTENT: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; description: string }> = {
  'no-clients': {
    icon: <UsersIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />,
    title: 'Aún no hay clientes',
    description: 'Crea tu primer cliente para empezar a gestionar tu cartera comercial.',
  },
  'search-empty': {
    icon: <MagnifyingGlassIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />,
    title: 'Sin resultados',
    description: 'No encontramos clientes que coincidan con tu búsqueda.',
  },
  'no-contacts': {
    icon: <UsersIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />,
    title: 'Aún no hay contactos',
    description: 'Crea tu primer contacto para empezar.',
  },
}

export function EmptyState({ variant }: EmptyStateProps) {
  const content = VARIANT_CONTENT[variant]

  return (
    <div
      data-testid={`empty-state-${variant}`}
      className="flex flex-col items-center justify-center gap-2 p-8 text-center"
    >
      {content.icon}
      <p className="text-sm font-medium text-slate-900">{content.title}</p>
      <p className="text-sm text-slate-600">{content.description}</p>
    </div>
  )
}
