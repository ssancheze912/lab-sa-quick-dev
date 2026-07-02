import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({ component: ContactosPage })

function ContactosPage() {
  return (
    <section
      data-testid="contactos-view"
      aria-labelledby="contactos-title"
      className="p-6"
    >
      <h1 id="contactos-title" className="text-2xl font-bold text-slate-900">
        Contactos
      </h1>
      <p className="mt-2 text-slate-600">
        La gestión de contactos se habilitará en la Épica 3.
      </p>
    </section>
  )
}
