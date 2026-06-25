import { createFileRoute } from '@tanstack/react-router'

function ContactosPlaceholder() {
  return (
    <div data-testid="contactos-placeholder" className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholder,
})
