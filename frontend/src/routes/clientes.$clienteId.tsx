/**
 * Story 2.1 — Task 16
 *
 * Dynamic route `/clientes/$clienteId`. Renders the same split layout as
 * `/clientes` but with a placeholder right panel — Story 2.2 will replace
 * the placeholder with the real client detail view and the right panel
 * content driven by `useParams().clienteId`.
 */
import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes/$clienteId')({
  component: ClienteListWithPlaceholderDetail,
})

function ClienteListWithPlaceholderDetail() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <main className="flex-1 p-6" data-testid="cliente-detail-placeholder">
        <p className="text-sm text-slate-500">
          Próximamente: detalle del cliente (Story 2.2).
        </p>
      </main>
    </div>
  )
}
