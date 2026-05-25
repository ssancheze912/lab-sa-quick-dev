import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="p-6" data-testid="page-contactos">
      <h1 className="text-2xl font-bold text-slate-800" data-testid="contactos-page-title">Contactos</h1>
    </div>
  )
}
