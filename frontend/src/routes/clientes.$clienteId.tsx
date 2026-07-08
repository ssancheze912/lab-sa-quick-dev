import { createFileRoute } from '@tanstack/react-router'

/**
 * Placeholder route for /clientes/$clienteId (Story 2.1).
 *
 * Story 2.1 only needs the URL to change on selection so the list item shows
 * as selected — the right-panel detail view is Story 2.2's scope. This file
 * exists solely so TanStack Router can resolve the navigation target and so
 * `useParams({ strict: false }).clienteId` yields the URL segment inside the
 * parent's Outlet.
 */
export const Route = createFileRoute('/clientes/$clienteId')({
  component: ClienteDetailPlaceholder,
})

function ClienteDetailPlaceholder() {
  return null
}
