import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate } from '@tanstack/react-router'
import { Button } from 'siesa-ui-kit'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClienteNotFound } from '@/shared/components/ClienteNotFound'
import { isValidClienteId, useCliente } from '../application/useCliente'
import type { Cliente } from '../domain/Cliente'
import { ClienteEditDialog } from './ClienteEditDialog'

export interface ClienteDetailViewProps {
  clienteId: string
}

/**
 * Extract an HTTP status from an axios/fetch-shaped error object. Kept
 * local (not exported) — the same helper lives inside `useCliente` for the
 * retry predicate; presentation only reads it to branch between 404 (→
 * ClienteNotFound) and non-404 errors (→ ErrorPanel).
 */
function extractStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const withStatus = error as { status?: number; response?: { status?: number } }
  return withStatus.response?.status ?? withStatus.status
}

/**
 * Client detail view (Story 2.2). Branches:
 *   1. clienteId is not a UUID          → ClienteNotFound (network short-circuit)
 *   2. Query loading (first fetch)      → ClienteDetailSkeleton
 *   3. Query error, status === 404      → ClienteNotFound
 *   4. Query error, status !== 404      → ErrorPanel (with retry)
 *   5. Query success, data present      → ClienteDetailCard
 *
 * Renders exactly Nombre, NIT/RUC, Teléfono, Ciudad — no createdAt/updatedAt,
 * no edit/delete buttons, no ContactManager (deliberate; those live in later
 * stories).
 */
export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const navigate = useNavigate()
  const enabled = isValidClienteId(clienteId)
  const query = useCliente(clienteId)
  const backToList = () => void navigate({ to: '/clientes' })

  // AC #4 — non-UUID short-circuits without hitting the network.
  if (!enabled) {
    return <ClienteNotFound onBackToList={backToList} />
  }

  if (query.isLoading) {
    return <ClienteDetailSkeleton />
  }

  if (query.isError) {
    // AC #3 — 404 is a graceful not-found state.
    if (extractStatus(query.error) === 404) {
      return <ClienteNotFound onBackToList={backToList} />
    }
    // AC #6 — any other failure surfaces the retry-capable ErrorPanel.
    return (
      <ErrorPanel
        title="No se pudo cargar el cliente"
        subtitle="Comprueba tu conexión e intenta nuevamente."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  if (!query.data) {
    // Defensive branch — hit if the query settles without data (rare).
    return <ClienteNotFound onBackToList={backToList} />
  }

  return <ClienteDetailCard cliente={query.data} />
}

function ClienteDetailSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="Cargando detalle del cliente"
      data-testid="cliente-detail-skeleton"
      className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton width={80} height={12} />
          <Skeleton height={20} />
        </div>
      ))}
    </article>
  )
}

function ClienteDetailCard({ cliente }: { cliente: Cliente }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <article
      data-testid="cliente-detail"
      data-cliente-id={cliente.id}
      className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {cliente.nombre}
        </h2>
        <Button
          type="outline"
          onClick={() => setEditOpen(true)}
          aria-label="Editar cliente"
          data-testid="cliente-detail-edit"
        >
          Editar
        </Button>
      </header>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="NIT/RUC" value={cliente.nit} testId="detail-nit" />
        <Field label="Teléfono" value={cliente.telefono} testId="detail-telefono" />
        <Field label="Ciudad" value={cliente.ciudad} testId="detail-ciudad" />
      </dl>
      <ClienteEditDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente} />
    </article>
  )
}

function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd data-testid={testId} className="text-sm text-slate-900">
        {value}
      </dd>
    </div>
  )
}
