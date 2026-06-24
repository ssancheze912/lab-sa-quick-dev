import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView() {
  return (
    <div data-testid="contactos-view">
      <h1>Contactos</h1>
    </div>
  )
}
