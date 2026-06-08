import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
    </main>
  )
}
