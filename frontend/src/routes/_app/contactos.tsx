import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContactoListView } from '@/modules/crm/contactos/presentation/components/ContactoListView'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
  notFoundComponent: NotFoundView,
})

function ContactosView() {
  return (
    <div data-testid="contactos-view" className="flex h-full">
      <ContactoListView />
      <Outlet />
    </div>
  )
}
