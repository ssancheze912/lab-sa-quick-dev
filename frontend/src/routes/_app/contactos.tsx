import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholderView,
})

function ContactosPlaceholderView() {
  return (
    <div data-testid="contactos-placeholder-view" className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Sección Contactos — próximamente
      </h1>
    </div>
  )
}
