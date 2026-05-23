import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundView,
})

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50 dark:bg-slate-950">
      <h1 className="text-6xl font-bold text-slate-800 dark:text-slate-100 mb-4">404</h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
        Página no encontrada
      </p>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        La página que estás buscando no existe o fue movida.
      </p>
      <Link
        to="/clientes"
        className="px-6 py-3 bg-[#0e79fd] text-white rounded-lg font-medium hover:bg-[#154ca9] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
