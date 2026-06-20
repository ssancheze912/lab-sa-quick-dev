import { createFileRoute } from '@tanstack/react-router'

function ContactosView() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-800">Contactos</h2>
      <p className="mt-2 text-slate-600">Lista de contactos (implementación en Épica 3).</p>
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})
