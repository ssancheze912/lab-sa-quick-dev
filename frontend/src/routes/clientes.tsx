import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold tracking-tight">Clientes</h1>
    </div>
  )
}
