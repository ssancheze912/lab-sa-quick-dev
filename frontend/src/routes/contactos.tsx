import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <div data-testid="contactos-view" className="p-4">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </div>
  )
}
