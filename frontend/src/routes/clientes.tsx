import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes'

export const Route = createFileRoute('/clientes')({ component: ClientesPage })

function ClientesPage() {
  return (
    <section
      data-testid="clientes-view"
      aria-labelledby="clientes-title"
      className="flex h-[calc(100dvh-56px)] lg:h-[100dvh]"
    >
      <ClienteListView />
      <div className="hidden flex-1 items-center justify-center text-slate-400 lg:flex">
        Selecciona un cliente para ver el detalle
      </div>
    </section>
  )
}
