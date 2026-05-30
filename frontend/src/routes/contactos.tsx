import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return <div data-testid="contactos-page">Contactos</div>
}
