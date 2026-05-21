import { createFileRoute } from '@tanstack/react-router'

function ClientesPage() {
  return (
    <div className="p-8" data-testid="clientes-view">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
