import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Siesa Agents CRM</h1>
      <p className="mt-4 text-lg">Foundation ready.</p>
    </main>
  )
}
