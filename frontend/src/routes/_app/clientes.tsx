/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

function ClientesView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})
