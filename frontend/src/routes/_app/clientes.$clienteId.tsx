import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailStub,
})

function ClienteDetailStub() {
  // Story 2.2 will implement the detail view
  return null
}
