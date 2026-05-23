import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      {/* Right panel — placeholder for Story 2.2 */}
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Selecciona un cliente para ver su detalle
      </div>
    </div>
  )
}
