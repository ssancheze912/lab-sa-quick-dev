import { ClienteListView } from './ClienteListView'

/**
 * Story 2.2 — Canonical dual-pane layout for the `/clientes` and
 * `/clientes/$clienteId` routes.
 *
 * Mounting `<ClienteListView />` here (once) lets React reconciliation preserve
 * the list panel across navigations between the two routes — no remount, no
 * flicker, and the in-memory selection state stays consistent.
 */
export interface ClientesShellProps {
  children: React.ReactNode
}

export function ClientesShell({ children }: ClientesShellProps): React.ReactElement {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ClienteListView />
      <section className="flex-1 overflow-y-auto p-6">{children}</section>
    </div>
  )
}
