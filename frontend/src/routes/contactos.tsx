import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <section data-testid="page-contactos" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
    </section>
  )
}
