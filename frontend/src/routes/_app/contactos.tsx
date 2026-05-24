import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholder,
})

function ContactosPlaceholder() {
  return (
    <main data-testid="contactos-view">
      <h1>Contactos</h1>
    </main>
  )
}
