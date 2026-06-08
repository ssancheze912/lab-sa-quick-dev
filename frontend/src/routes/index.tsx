/**
 * Story 1.2 — Task 1
 *
 * The root URL `/` redirects to `/clientes` via `beforeLoad` (AC #5).
 * No UI is rendered here.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
