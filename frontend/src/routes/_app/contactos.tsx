import { createFileRoute } from '@tanstack/react-router'
import { ContactosShellView } from '../../modules/crm/contactos/presentation/components/ContactosShellView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return <ContactosShellView />
}
