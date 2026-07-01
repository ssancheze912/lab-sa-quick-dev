import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return <div data-testid="clientes-view">Clientes</div>
}
