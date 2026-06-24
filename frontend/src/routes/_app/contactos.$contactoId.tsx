import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailStub,
})

function ContactoDetailStub() {
  return null
}
