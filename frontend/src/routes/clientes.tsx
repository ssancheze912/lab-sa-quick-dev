import { createFileRoute } from '@tanstack/react-router'

function ClientesView() {
  return (
    <section aria-label="Clientes">
      <h1 className="text-4xl font-bold tracking-tight">Clientes</h1>
    </section>
  )
}

export const Route = createFileRoute('/clientes')({
  component: ClientesView,
})
