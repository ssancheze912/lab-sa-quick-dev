import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Root path — redirects in-app to `/clientes`. No component is rendered
 * so there is no visible flash of a landing page before the redirect.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
