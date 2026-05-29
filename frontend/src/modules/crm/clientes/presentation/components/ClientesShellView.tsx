import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export function ClientesShellView() {
  return (
    <div data-testid="clientes-shell-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Clientes</h1>
      <div data-testid="clientes-skeleton">
        <Skeleton count={5} height={48} className="mb-2" />
      </div>
    </div>
  )
}
