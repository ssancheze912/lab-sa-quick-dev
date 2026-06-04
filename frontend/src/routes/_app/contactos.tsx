import { createFileRoute } from '@tanstack/react-router'
import { ContactosView } from '../../modules/crm/contactos/presentation/ContactosView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})
