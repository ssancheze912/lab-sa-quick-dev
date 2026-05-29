import { Link } from '@tanstack/react-router'

interface NotFoundViewProps {
  message?: string
}

export function NotFoundView({ message = 'Página no encontrada' }: NotFoundViewProps) {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen gap-4 p-8"
    >
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p
        data-testid="not-found-message"
        className="text-lg text-slate-600"
      >
        {message}
      </p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-siesa-blue hover:underline font-medium"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
