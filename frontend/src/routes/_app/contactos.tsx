import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <section data-testid="contactos-view" className="py-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Contactos
      </h1>
    </section>
  )
}
