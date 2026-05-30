import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholder,
})

function ContactosPlaceholder() {
  return (
    <div data-testid="contactos-placeholder">
      <p>Vista de Contactos — en construcción</p>
    </div>
  )
}
