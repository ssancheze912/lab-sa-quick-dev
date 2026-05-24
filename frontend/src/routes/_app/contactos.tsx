/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

function ContactosView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Contactos</h1>
    </div>
  )
}

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosView,
})
