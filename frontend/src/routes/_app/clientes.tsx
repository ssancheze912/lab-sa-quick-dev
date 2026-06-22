import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: () => (
    <div data-testid="clientes-shell-view" className="p-4">
      <h1 className="text-2xl font-semibold">Clientes</h1>
    </div>
  ),
})
