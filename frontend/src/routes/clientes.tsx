import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <section data-testid="page-clientes" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
    </section>
  )
}
