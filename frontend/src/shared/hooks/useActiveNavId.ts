import { useLocation } from '@tanstack/react-router'

export type ActiveNavId = 'clientes' | 'contactos' | null

/**
 * Returns the active navigation id derived from the current pathname.
 * Used to drive the visual active state of NavigationRail and NavigationBar.
 */
export function useActiveNavId(): ActiveNavId {
  const { pathname } = useLocation()

  if (pathname.startsWith('/clientes')) return 'clientes'
  if (pathname.startsWith('/contactos')) return 'contactos'
  return null
}
