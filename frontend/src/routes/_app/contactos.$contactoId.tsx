import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailStub,
})

function ContactoDetailStub() {
  const { contactoId } = Route.useParams()
  return (
    <div>
      <p>Detalle de contacto: {contactoId}</p>
    </div>
  )
}
