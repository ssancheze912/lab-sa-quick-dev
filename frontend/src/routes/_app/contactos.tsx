import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <main role="main" aria-label="Contactos" data-testid="contactos-page">
      <h1 className="text-xl font-bold text-slate-900">Contactos</h1>
    </main>
  )
}
