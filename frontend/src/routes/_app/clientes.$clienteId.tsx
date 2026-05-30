import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPlaceholder,
})

function ClienteDetailPlaceholder() {
  return (
    <div
      data-testid="cliente-detail-placeholder"
      className="flex items-center justify-center h-full text-slate-400"
    >
      <p>Selecciona un cliente para ver sus detalles</p>
    </div>
  )
}
