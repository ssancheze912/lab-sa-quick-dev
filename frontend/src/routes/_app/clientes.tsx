import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
      <p className="mt-2 text-slate-600">Lista de clientes</p>
    </div>
  )
}

function ClientesPage() {
  return <ClientesPlaceholder />
}
