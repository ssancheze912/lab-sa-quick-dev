import { createFileRoute } from '@tanstack/react-router'
import { ContactoDetailPanel } from '../../modules/crm/contactos/presentation/ContactoDetailPanel'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailComponent,
})

function ContactoDetailComponent() {
  const { contactoId } = Route.useParams()
  return <ContactoDetailPanel contactoId={contactoId} />
}
