import { createFileRoute } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="flex flex-col h-full" data-testid="contactos-view">
      <ContactoListView />
    </div>
  )
}
