import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
      {/* Implementación completa en Épica 2 */}
    </div>
  )
}
