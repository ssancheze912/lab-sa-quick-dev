import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClientesIndexView,
})

function ClientesIndexView() {
  return (
    <div data-testid="cliente-detail-panel" className="flex flex-1 items-center justify-center">
      <p className="text-slate-500">Selecciona un cliente para ver su detalle</p>
    </div>
  )
}
