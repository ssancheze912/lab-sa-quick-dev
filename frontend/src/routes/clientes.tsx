import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

function ClientesRoute() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex h-full">
      <ClienteListView
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedClienteId={null}
        onSelectCliente={() => {}}
      />
      <section
        data-testid="cliente-detail-placeholder"
        className="hidden lg:flex flex-1 items-center justify-center text-slate-400"
      >
        Selecciona un cliente para ver el detalle
      </section>
    </div>
  )
}

export const Route = createFileRoute('/clientes')({
  component: ClientesRoute,
})
