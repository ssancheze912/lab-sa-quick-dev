import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({ component: ClientesPage })

function ClientesPage() {
  return (
    <section
      data-testid="clientes-view"
      aria-labelledby="clientes-title"
      className="p-6"
    >
      <h1 id="clientes-title" className="text-2xl font-bold text-slate-900">
        Clientes
      </h1>
      <p className="mt-2 text-slate-600">
        La gestión de clientes se habilitará en la Épica 2.
      </p>
    </section>
  )
}
