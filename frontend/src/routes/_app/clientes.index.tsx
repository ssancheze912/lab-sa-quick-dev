import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClientesIndexPage,
})

function ClientesIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
      Selecciona un cliente de la lista para ver su detalle.
    </div>
  )
}
