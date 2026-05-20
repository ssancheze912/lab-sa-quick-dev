import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div data-testid="contactos-view" className="p-8">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </div>
  )
}
