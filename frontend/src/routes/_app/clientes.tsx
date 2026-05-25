import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="p-6" data-testid="page-clientes">
      <h1 className="text-2xl font-bold text-slate-800" data-testid="clientes-page-title">Clientes</h1>
    </div>
  )
}
