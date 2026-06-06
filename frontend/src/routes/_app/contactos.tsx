import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="p-6" data-testid="contactos-page">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Contactos</h1>
    </div>
  )
}
