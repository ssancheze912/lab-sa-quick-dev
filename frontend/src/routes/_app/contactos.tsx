import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosLayout,
})

function ContactosLayout() {
  return (
    <div className="flex h-full" data-testid="contactos-view">
      <ContactoListView />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
