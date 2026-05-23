import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold tracking-tight">Contactos</h1>
    </div>
  )
}
