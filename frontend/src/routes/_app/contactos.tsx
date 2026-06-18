import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <div data-testid="contactos-view">
      <h2 className="text-2xl font-bold text-slate-900">Contactos</h2>
    </div>
  )
}
