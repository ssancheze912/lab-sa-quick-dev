import { createFileRoute } from '@tanstack/react-router'
import { ContactosPlaceholderView } from '../../modules/crm/contactos/presentation/ContactosPlaceholderView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholderView,
})
