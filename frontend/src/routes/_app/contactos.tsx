import { createFileRoute } from '@tanstack/react-router'
import { ContactosPlaceholder } from '../../modules/crm/contactos/presentation/ContactosPlaceholder'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholder,
})
