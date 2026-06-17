import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})

function IndexPage() {
  return (
    <div>
      <h1>Agentes Siesa</h1>
    </div>
  )
}
