import { createFileRoute } from '@tanstack/react-router'

function ContactosPage() {
  return (
    <div data-testid="contactos-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})
