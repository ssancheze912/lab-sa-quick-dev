import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div data-testid="clientes-view" className="p-8">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </div>
  )
}
