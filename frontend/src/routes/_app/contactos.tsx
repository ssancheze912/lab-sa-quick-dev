import { createFileRoute } from '@tanstack/react-router'
import { ContactoListView } from '@/modules/crm/contactos/presentation/components/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return <ContactoListView />
}
