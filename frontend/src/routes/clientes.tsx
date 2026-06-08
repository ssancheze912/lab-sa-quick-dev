import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
    </main>
  )
}
