import { createFileRoute } from '@tanstack/react-router'
import { ContactoDetailView } from '@/modules/crm/contactos/presentation/components/ContactoDetailView'

export const Route = createFileRoute('/_app/contactos/')({
  component: ContactoEmptyRoute,
})

function ContactoEmptyRoute() {
  return <ContactoDetailView />
}
