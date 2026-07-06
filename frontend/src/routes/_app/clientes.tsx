import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
  // Story 2.2 turns this route into a layout with children (`clientes.index.tsx`,
  // `clientes.$clienteId.tsx`). TanStack Router's fuzzy not-found resolution now stops
  // at THIS route for any nested path under "/clientes" that matches no child leaf route
  // (e.g. "/clientes/a/b"), rather than bubbling up to `/_app`'s notFoundComponent — so a
  // dedicated registration here is required to keep AC5's Spanish 404 UX working for
  // nested unknown paths, mirroring the same pattern already used on `/_app` and the root.
  notFoundComponent: NotFoundView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full flex-col">
      <h1 className="p-6 pb-0 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        Clientes
      </h1>
      <div className="flex flex-1 overflow-hidden p-6">
        <ClienteListView />
        <Outlet />
      </div>
    </div>
  )
}
