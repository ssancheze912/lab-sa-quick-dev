import { createFileRoute } from '@tanstack/react-router'

function ContactosPage() {
  return (
    <div className="p-6" data-testid="contactos-view">
      Contactos
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})
