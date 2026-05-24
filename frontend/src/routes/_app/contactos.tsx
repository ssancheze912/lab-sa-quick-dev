import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <div data-testid="contactos-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Contactos
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Vista de contactos — disponible en la épica 3.
      </p>
    </div>
  )
}
