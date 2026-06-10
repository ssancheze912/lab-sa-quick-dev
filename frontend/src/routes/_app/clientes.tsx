import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView(): JSX.Element {
  return (
    <div data-testid="clientes-view" className="p-6">
      Clientes
    </div>
  )
}
