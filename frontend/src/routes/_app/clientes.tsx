import { createFileRoute } from '@tanstack/react-router'

function ClientesPlaceholder() {
  return (
    <div className="p-8" data-testid="clientes-view">
      <p>Clientes — próximamente</p>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})
