import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </main>
  )
}
