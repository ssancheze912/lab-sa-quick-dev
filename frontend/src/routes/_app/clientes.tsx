import { createFileRoute } from '@tanstack/react-router'

function ClientesPage() {
  return (
    <div className="p-6" data-testid="clientes-view">
      Clientes
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
