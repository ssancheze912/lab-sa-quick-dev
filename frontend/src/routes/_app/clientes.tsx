import { createFileRoute } from '@tanstack/react-router'

function ClientesView() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-800">Clientes</h2>
      <p className="mt-2 text-slate-600">Lista de clientes (implementación en Épica 2).</p>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})
