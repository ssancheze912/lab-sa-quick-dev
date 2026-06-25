import { createFileRoute } from '@tanstack/react-router'

function ClientesPlaceholder() {
  return (
    <div data-testid="clientes-placeholder" className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})
