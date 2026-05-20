import { createFileRoute } from '@tanstack/react-router'

function IndexComponent() {
  return <div>Siesa Agents</div>
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
})
