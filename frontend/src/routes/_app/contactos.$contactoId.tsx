import { createFileRoute } from '@tanstack/react-router'
import { ContactoDetailView } from '@/modules/crm/contactos/presentation/components/ContactoDetailView'
import { useContactos } from '@/modules/crm/contactos/application/hooks/useContactos'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailRoute,
})

function ContactoDetailRoute() {
  const { contactoId } = Route.useParams()
  // `ContactoListView` (sibling panel, see routes/_app/contactos.tsx) already
  // fetches the full contactos list under the same ['contactos'] query key —
  // once it resolves, we can tell locally whether `contactoId` exists without
  // ever issuing the individual by-id request for an id that doesn't exist.
  // See ContactoDetailView's `listMembership` prop doc for why this matters
  // (NFR6 / zero console errors).
  const { data: contactos, isSuccess } = useContactos()
  const listMembership: 'pending' | 'present' | 'missing' = !isSuccess
    ? 'pending'
    : contactos.some((contacto) => contacto.id === contactoId)
      ? 'present'
      : 'missing'

  return <ContactoDetailView contactoId={contactoId} listMembership={listMembership} />
}
