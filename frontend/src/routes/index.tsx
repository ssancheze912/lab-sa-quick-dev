/**
 * Index route — redirects / to /clientes
 * Story 1.2: Frontend Navigation Shell
 *
 * AC6: Root path / automatically redirects to /clientes.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
