import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-3xl font-bold text-brand-primary">Siesa Agents</h1>
      <p className="text-slate-600">
        Aplicación inicializada correctamente. Listo para implementar funcionalidades.
      </p>
    </main>
  )
}
