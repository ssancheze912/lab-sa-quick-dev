import { createFileRoute } from '@tanstack/react-router'

function ContactosPlaceholder() {
  return (
    <div className="p-8" data-testid="contactos-view">
      <p>Contactos — próximamente</p>
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPlaceholder,
})
