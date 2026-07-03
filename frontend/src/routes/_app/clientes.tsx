import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholderView,
})

function ClientesPlaceholderView() {
  return (
    <section data-testid="clientes-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
      <p className="mt-2 text-slate-600">
        La gestión de clientes se habilitará en el Epic 2.
      </p>
    </section>
  )
}
