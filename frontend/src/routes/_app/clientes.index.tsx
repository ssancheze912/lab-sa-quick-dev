import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClientesEmptyDetail,
})

function ClientesEmptyDetail() {
  return (
    <div
      data-testid="cliente-detail-placeholder"
      className="flex-1 hidden lg:flex items-center justify-center text-sm text-slate-500"
    >
      Selecciona un cliente para ver el detalle
    </div>
  )
}
