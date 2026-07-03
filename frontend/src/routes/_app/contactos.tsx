import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholderView,
})

function ContactosPlaceholderView() {
  return (
    <section data-testid="contactos-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
      <p className="mt-2 text-slate-600">
        La gestión de contactos se habilitará en el Epic 3.
      </p>
    </section>
  )
}
