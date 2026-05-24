import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})

function ClientesPlaceholder() {
  return (
    <main data-testid="clientes-view">
      <h1>Clientes</h1>
    </main>
  )
}
