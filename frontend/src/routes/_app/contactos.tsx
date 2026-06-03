import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <div
      className="p-6"
      data-testid="contactos-view"
    >
      <h1 className="text-2xl font-bold text-slate-800">Sección Contactos</h1>
    </div>
  )
}
