import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contactos')({
  component: ContactosPlaceholder,
})

function ContactosPlaceholder(): React.ReactElement {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </main>
  )
}
