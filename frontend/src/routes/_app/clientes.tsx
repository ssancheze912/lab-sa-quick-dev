import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </main>
  )
}
