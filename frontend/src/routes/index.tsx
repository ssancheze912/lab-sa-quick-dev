import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <main>
      <h1>Siesa Agents</h1>
    </main>
  ),
})
