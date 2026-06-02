import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

/**
 * Placeholder view for `/clientes` (Story 1.2). No data fetching, no API calls.
 * The real list view ships in Story 2.1.
 */
export function ClientesPlaceholderView() {
  return (
    <section data-testid="clientes-placeholder" className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
      <p className="text-slate-600">Sección en construcción.</p>
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton height={56} count={3} />
      </div>
    </section>
  )
}
