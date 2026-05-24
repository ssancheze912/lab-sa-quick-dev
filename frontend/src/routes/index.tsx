import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main data-testid="home-page">
      <h1 data-testid="home-page-title">Siesa Agents</h1>
    </main>
  )
}
