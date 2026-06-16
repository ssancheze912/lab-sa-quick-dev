import { useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteListViewProps {
  selectedClienteId?: string
  onSelectCliente?: (id: string) => void
}

export function ClienteListView({ selectedClienteId, onSelectCliente }: ClienteListViewProps) {
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data, isLoading, isError, refetch } = useClientes()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(inputValue)
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return data
    return data.filter(
      c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  return (
    <div className="w-[280px] h-full flex flex-col border-r border-slate-200">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-col gap-2">
        <h2 className="text-base font-bold text-slate-800">Clientes</h2>
        <input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC..."
          aria-label="Buscar clientes"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <ul
            aria-busy="true"
            aria-label="Cargando clientes"
            className="px-4 py-2 space-y-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Skeleton height={16} className="mb-1" />
                <Skeleton height={12} width="60%" />
              </li>
            ))}
          </ul>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && data !== undefined && (
          <>
            {data.length === 0 && (
              <EmptyState message="No hay clientes registrados. Crea el primero." />
            )}

            {data.length > 0 && filtered.length === 0 && searchQuery.trim() !== '' && (
              <p className="px-4 py-3 text-sm text-slate-500">
                Sin resultados para &lsquo;{searchQuery}&rsquo;
              </p>
            )}

            {filtered.length > 0 && (
              <ul role="list" aria-label="Lista de clientes">
                {filtered.map(cliente => (
                  <ClientListItem
                    key={cliente.id}
                    cliente={cliente}
                    isSelected={cliente.id === selectedClienteId}
                    onClick={() => onSelectCliente?.(cliente.id)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
