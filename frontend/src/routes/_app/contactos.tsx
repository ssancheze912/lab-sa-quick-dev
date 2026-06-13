import { createFileRoute } from '@tanstack/react-router'
import { ContactosPage } from '../../modules/crm/contactos/presentation/ContactosPage'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})
