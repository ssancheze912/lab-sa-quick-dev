import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Siesa Agents</h1>
        <p className="mt-2 text-slate-600">
          Aplicación inicializada — Story 1.1 completada.
        </p>
      </div>
    </main>
  )
}
