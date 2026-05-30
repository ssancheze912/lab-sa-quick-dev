import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})

function ClientesPlaceholder() {
  return (
    <div data-testid="clientes-placeholder">
      <p>Vista de Clientes — en construcción</p>
    </div>
  )
}
