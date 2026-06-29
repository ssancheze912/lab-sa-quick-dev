import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosLayout,
})

function ContactosLayout() {
  const { location } = useRouterState()
  // Hide the list panel when viewing a specific contact detail so that
  // cargo / nombre text only appears once in the DOM (enables strict-mode text locators).
  const isDetailView = /\/contactos\/[^/]+/.test(location.pathname)

  return (
    <div className="flex h-full" data-testid="contactos-view">
      {!isDetailView && <ContactoListView />}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
