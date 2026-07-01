import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

/**
 * Split-panel /clientes page — Story 2.1.
 *
 * The 280px list panel is fully implemented in this story. The right panel is a
 * placeholder that Story 2.2 replaces with `<ClienteDetailView />` driven by
 * `/clientes/:clienteId`. The local `selectedId` state is temporary — Story 2.2
 * moves it to a URL param.
 */
function ClientesPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  return (
    <section
      data-testid="page-clientes"
      className="flex h-full min-h-[calc(100vh-5rem)] lg:min-h-screen"
    >
      <ClienteListView selectedId={selectedId} onSelect={setSelectedId} />
      <div
        data-testid="cliente-detail-empty"
        className="flex flex-1 items-center justify-center text-sm text-slate-400"
      >
        Selecciona un cliente para ver su detalle
      </div>
    </section>
  )
}
