import { useNavigate, useRouterState } from '@tanstack/react-router'

/**
 * Navigation surface identifiers exposed by the AppShell.
 * Kept in sync with the route paths `/clientes` and `/contactos`.
 */
export type NavId = 'clientes' | 'contactos'

export interface ShellNavigation {
  /** Active nav id derived from the current pathname, `null` for unknown routes. */
  activeId: NavId | null
  /** Trigger a TanStack Router SPA navigation to the given nav surface. */
  onNavigate: (id: NavId) => void
}

/**
 * Derives navigation state from TanStack Router (URL is the source of truth)
 * and exposes a stable `onNavigate` callback that performs SPA navigation.
 *
 * Active rule: pathname startsWith — so `/clientes/:id` (Epic 2) still lights
 * up the "Clientes" entry. Unknown / redirect cases return `null`.
 */
export function useShellNavigation(): ShellNavigation {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  const activeId: NavId | null = pathname.startsWith('/clientes')
    ? 'clientes'
    : pathname.startsWith('/contactos')
      ? 'contactos'
      : null

  return {
    activeId,
    onNavigate: (id: NavId) => {
      void navigate({ to: id === 'clientes' ? '/clientes' : '/contactos' })
    },
  }
}
