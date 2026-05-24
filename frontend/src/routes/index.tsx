import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <main>
      <h1>Siesa Agents</h1>
    </main>
  )
}
