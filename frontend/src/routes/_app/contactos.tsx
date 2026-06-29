import { z } from 'zod'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

const contactosSearch = z.object({
  sinCliente: z.boolean().optional(),
})

export const Route = createFileRoute('/_app/contactos')({
  validateSearch: contactosSearch,
  component: ContactosLayout,
})

function ContactosLayout() {
  const { location } = useRouterState()
  // Hide the list panel when viewing a specific contact detail so that
  // cargo / nombre text only appears once in the DOM (enables strict-mode text locators).
  const isDetailView = /\/contactos\/[^/]+/.test(location.pathname)

  const { sinCliente } = Route.useSearch()
  const navigate = Route.useNavigate()

  function handleToggleSinCliente() {
    void navigate({
      search: (prev) => ({ ...prev, sinCliente: sinCliente ? undefined : true }),
    })
  }

  return (
    <div className="flex h-full" data-testid="contactos-view">
      {!isDetailView && (
        <ContactoListView
          sinClienteParam={sinCliente ?? false}
          onToggleSinCliente={handleToggleSinCliente}
        />
      )}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
