import { useNavigate, useRouterState } from '@tanstack/react-router'

export type NavId = 'clientes' | 'contactos'

/**
 * Derives the currently active navigation id from the router state and exposes
 * a typed `navigate(id)` helper. Single source of truth consumed by both
 * `AppShell` (desktop) and `MobileShell` (mobile) so the visible active state
 * stays in sync with the browser URL (deep-link + back/forward included).
 */
export function useActiveNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigateFn = useNavigate()

  // Exact match or the route + '/' prefix — avoids false matches like
  // "/clientesX" being treated as the "clientes" section while still keeping
  // nested URLs (e.g. "/clientes/:id" in future stories) marked as active.
  let activeId: NavId | null = null
  if (pathname === '/clientes' || pathname.startsWith('/clientes/')) activeId = 'clientes'
  else if (pathname === '/contactos' || pathname.startsWith('/contactos/')) activeId = 'contactos'

  const navigate = (id: NavId) => {
    navigateFn({ to: id === 'clientes' ? '/clientes' : '/contactos' })
  }

  return { activeId, navigate }
}
