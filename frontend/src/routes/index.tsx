import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Root path `/` redirects to `/clientes` via TanStack Router (TC-E1-P2-03).
 * Using `beforeLoad` + `throw redirect` is the official declarative pattern;
 * NO `window.location` manipulation, NO full reload.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
