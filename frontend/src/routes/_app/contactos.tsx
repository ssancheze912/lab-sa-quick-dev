import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

function ContactosPage() {
  return (
    <div className="flex h-full" data-testid="contactos-view">
      <ContactoListView />
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})
