import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <main role="main" aria-label="Clientes" data-testid="clientes-page">
      <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
    </main>
  )
}
