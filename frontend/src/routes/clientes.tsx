/**
 * Story 1.2 — Task 1
 *
 * Flat file route for `/clientes`. Renders the placeholder until Story 2.1
 * replaces it with the real ClienteListView.
 */
import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholderView } from '@/modules/crm/clientes/presentation/ClientesPlaceholderView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPlaceholderView,
})
