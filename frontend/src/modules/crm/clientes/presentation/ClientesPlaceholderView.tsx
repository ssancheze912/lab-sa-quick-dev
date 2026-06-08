/**
 * Story 1.2 — Task 3
 *
 * Placeholder view for the /clientes route. Stories 2.1 will replace this
 * with the real ClienteListView. The data-testid is consumed by Vitest
 * component tests and Playwright E2E tests (TC-E1-P1-02 / TC-E1-P2-03).
 */
export function ClientesPlaceholderView() {
  return (
    <main data-testid="clientes-view" className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <p className="text-slate-600">Próximamente: lista de clientes.</p>
    </main>
  )
}
