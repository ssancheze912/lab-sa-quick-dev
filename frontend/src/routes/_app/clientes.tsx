import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <section data-testid="clientes-view" className="py-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Clientes
      </h1>
    </section>
  )
}
