import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: ClientesPlaceholder,
})

function ClientesPlaceholder(): React.ReactElement {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </main>
  )
}
