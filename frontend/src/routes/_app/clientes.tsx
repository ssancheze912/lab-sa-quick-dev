import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholderView,
})

function ClientesPlaceholderView() {
  return (
    <div data-testid="clientes-placeholder-view" className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Sección Clientes — próximamente
      </h1>
    </div>
  )
}
