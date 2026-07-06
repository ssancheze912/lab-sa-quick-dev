import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Página no encontrada</h1>
      <p className="text-slate-500">La página que buscas no existe o fue movida.</p>
      <Link to="/clientes" className="font-medium text-primary underline">
        Volver a Clientes
      </Link>
    </div>
  )
}
