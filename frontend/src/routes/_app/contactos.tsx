import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: () => (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Contactos</h1>
    </div>
  ),
})
