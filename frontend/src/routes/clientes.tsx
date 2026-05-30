import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return <div data-testid="clientes-page">Clientes</div>
}
