import { createFileRoute } from '@tanstack/react-router'

function ContactosView() {
  return (
    <section aria-label="Contactos">
      <h1 className="text-4xl font-bold tracking-tight">Contactos</h1>
    </section>
  )
}

export const Route = createFileRoute('/contactos')({
  component: ContactosView,
})
