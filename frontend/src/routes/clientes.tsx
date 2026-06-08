/**
 * Story 2.1 — Tasks 15 / 16
 *
 * `/clientes` renders the 280px ClienteListView on the left and a placeholder
 * right panel that prompts the user to pick a client. When a client is
 * selected the dynamic route `/clientes/$clienteId` takes over (Story 2.2
 * will replace its placeholder with the real detail view).
 */
import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesIndex,
})

function ClientesIndex() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <main className="flex-1 p-6">
        <p className="text-sm text-slate-500">
          Selecciona un cliente para ver su detalle
        </p>
      </main>
    </div>
  )
}
