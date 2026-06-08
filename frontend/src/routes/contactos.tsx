/**
 * Story 1.2 — Task 1
 *
 * Flat file route for `/contactos`. Renders the placeholder until Story 3.1
 * replaces it with the real ContactoListView.
 */
import { createFileRoute } from '@tanstack/react-router'
import { ContactosPlaceholderView } from '@/modules/crm/contactos/presentation/ContactosPlaceholderView'

export const Route = createFileRoute('/contactos')({
  component: ContactosPlaceholderView,
})
