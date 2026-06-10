import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})

function ContactosView(): JSX.Element {
  return (
    <div data-testid="contactos-view" className="p-6">
      Contactos
    </div>
  )
}
