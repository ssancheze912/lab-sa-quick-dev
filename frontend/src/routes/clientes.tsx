import { createFileRoute } from '@tanstack/react-router'

import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

interface ClientesRouteSearch {
  selected?: string
}

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
  validateSearch: (search: Record<string, unknown>): ClientesRouteSearch => ({
    selected: typeof search.selected === 'string' ? search.selected : undefined,
  }),
})

function ClientesPage(): React.ReactElement {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ClienteListView />
      <section className="flex-1 p-6">
        <p className="text-muted-foreground">
          Selecciona un cliente para ver sus detalles
        </p>
      </section>
    </div>
  )
}
