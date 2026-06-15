import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return <div data-testid="contactos-view">Contactos</div>
}
