import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div id="root-home">
      <h1>Siesa Agents</h1>
    </div>
  )
}
