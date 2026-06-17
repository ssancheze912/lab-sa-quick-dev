import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

export function ClientesPage() {
  return (
    <div className="p-6" data-testid="clientes-page">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
      <p className="mt-2 text-slate-600">Gestión de clientes — implementación en Épica 2.</p>
    </div>
  )
}
