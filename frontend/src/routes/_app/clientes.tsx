import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="p-6" data-testid="clientes-page">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Clientes</h1>
    </div>
  )
}
