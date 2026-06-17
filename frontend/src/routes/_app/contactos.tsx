import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

export function ContactosPage() {
  return (
    <div className="p-6" data-testid="contactos-page">
      <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
      <p className="mt-2 text-slate-600">Gestión de contactos — implementación en Épica 3.</p>
    </div>
  )
}
