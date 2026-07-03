import { createFileRoute } from '@tanstack/react-router'

/**
 * Landing route — placeholder shell. Real dashboard arrives in Epic 1 later stories.
 */
export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  return (
    <main className="flex min-h-full items-center justify-center p-8">
      <section className="max-w-lg text-center">
        <h1 className="text-3xl font-bold text-slate-900">Siesa Agents CRM</h1>
        <p className="mt-2 text-slate-600">
          Aplicación inicializada. Las funcionalidades se habilitarán en las siguientes historias.
        </p>
      </section>
    </main>
  )
}
