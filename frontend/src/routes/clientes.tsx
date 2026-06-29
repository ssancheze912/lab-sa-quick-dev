import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'

import { ClientesShell } from '@/modules/crm/clientes/presentation/ClientesShell'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage(): React.ReactElement {
  const matchRoute = useMatchRoute()
  // If a child route ($clienteId) is matched, render its content via <Outlet />;
  // otherwise show the default "select a client" hint in the right panel.
  const hasChild = matchRoute({ to: '/clientes/$clienteId', fuzzy: true })
  return (
    <ClientesShell>
      {hasChild ? (
        <Outlet />
      ) : (
        <p className="text-muted-foreground">
          Selecciona un cliente para ver sus detalles
        </p>
      )}
    </ClientesShell>
  )
}
