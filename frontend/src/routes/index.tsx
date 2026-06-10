import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 data-testid="home-heading" className="text-2xl font-bold text-slate-800">Siesa Agents</h1>
    </main>
  )
}
