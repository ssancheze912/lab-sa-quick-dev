import { createFileRoute } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactoListView,
})
