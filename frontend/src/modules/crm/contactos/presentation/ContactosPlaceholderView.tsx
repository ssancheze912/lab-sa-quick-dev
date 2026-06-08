/**
 * Story 1.2 — Task 3
 *
 * Placeholder view for the /contactos route. Stories 3.1 will replace this
 * with the real ContactoListView. The data-testid is consumed by Playwright
 * E2E tests (TC-E1-P1-03).
 */
export function ContactosPlaceholderView() {
  return (
    <section data-testid="contactos-view" className="p-6">
      <h1 className="text-2xl font-bold">Contactos</h1>
      <p className="text-slate-600">Próximamente: lista de contactos.</p>
    </section>
  )
}
