import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#0e79fd]">Siesa Agents</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Aplicación inicializada correctamente.
        </p>
      </div>
    </main>
  )
}
