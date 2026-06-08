import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Siesa Agents</h1>
      <p>Aplicación inicializada correctamente.</p>
    </main>
  )
}
