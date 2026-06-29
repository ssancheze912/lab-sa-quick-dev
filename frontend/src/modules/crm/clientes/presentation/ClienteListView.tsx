import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { SortControl, type SortOption } from '../../../../shared/components/SortControl'
import type { Cliente } from '../domain/Cliente'

function matchesQuery(text: string, query: string): boolean {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  // Substring check first (most common case, also covers NIT partial matches)
  if (t.includes(q)) return true
  // Subsequence check: each character of query must appear in order in text
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOption>('fecha-desc')

  const filteredAndSorted = useMemo(() => {
    if (!data) return []

    const trimmedQuery = searchQuery.trim()
    const filtered: Cliente[] = trimmedQuery
      ? data.filter(
          (c) =>
            matchesQuery(c.nombre, trimmedQuery) || matchesQuery(c.nit, trimmedQuery),
        )
      : data

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre)
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre)
        case 'fecha-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'fecha-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [data, searchQuery, sortOrder])

  if (isLoading) {
    return (
      <div data-testid="clientes-list-skeleton" className="w-[280px] flex-shrink-0 border-r border-slate-200 h-full">
        <div className="p-4">
          <Skeleton height={36} className="mb-3" />
          <Skeleton height={24} className="mb-2" count={8} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-[280px] flex-shrink-0 border-r border-slate-200 h-full flex items-center justify-center">
        <ErrorPanel onRetry={() => refetch()} />
      </div>
    )
  }

  if (data && data.length === 0) {
    return (
      <div className="w-[280px] flex-shrink-0 border-r border-slate-200 h-full flex items-center justify-center">
        <EmptyState message="No hay clientes registrados. Cree el primer cliente para comenzar." />
      </div>
    )
  }

  return (
    <div className="w-[280px] flex-shrink-0 border-r border-slate-200 h-full flex flex-col">
      <div className="p-3 border-b border-slate-200 space-y-2">
        <input
          data-testid="clientes-search-input"
          type="text"
          placeholder="Buscar por nombre o NIT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e79fd]"
        />
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>
      <div className="overflow-y-auto flex-1">
        {filteredAndSorted.map((cliente) => (
          <ClientListItem key={cliente.id} cliente={cliente} />
        ))}
      </div>
    </div>
  )
}
