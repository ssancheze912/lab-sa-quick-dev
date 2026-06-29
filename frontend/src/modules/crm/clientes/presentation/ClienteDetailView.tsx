import { useId } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { DescriptionList } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClienteNotFound } from '@/shared/components/ClienteNotFound'

import { useCliente } from '../application/useCliente'
import { ClienteNotFoundError } from '../domain/errors'

/**
 * Story 2.2 — Right-panel detail view for a single client.
 *
 * Branches in order: pending → skeleton, 404 → ClienteNotFound,
 * other errors → ErrorPanel, success → DescriptionList card.
 *
 * NFR6 — no technical detail reaches the rendered DOM. The query error object
 * is consumed here and the downstream components receive ONLY callbacks.
 */
export interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps): React.ReactElement {
  const navigate = useNavigate()
  const { data, status, error, refetch } = useCliente(clienteId)
  const headingId = useId()

  if (status === 'pending') {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        role="status"
        aria-busy="true"
        aria-label="Cargando cliente"
        className="flex flex-col gap-3 p-6"
      >
        <Skeleton height={28} width="60%" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton height={12} width="30%" />
            <Skeleton height={16} width="70%" />
          </div>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    if (error instanceof ClienteNotFoundError) {
      return (
        <ClienteNotFound
          onBackToList={() => void navigate({ to: '/clientes' })}
        />
      )
    }
    return <ErrorPanel onRetry={() => void refetch()} />
  }

  // status === 'success' — data is guaranteed defined
  return (
    <article
      data-testid="cliente-detail-card"
      aria-labelledby={headingId}
      className="flex flex-col gap-4"
    >
      <header className="flex flex-col gap-1">
        {/*
          The heading visibly displays the client's nombre; the trailing suffix
          " — Detalle del cliente" keeps the h2 text-content unique so the
          DescriptionList "Nombre" row can be addressed by its own value alone
          (AC #9).
        */}
        <h2
          id={headingId}
          className="text-3xl font-bold tracking-tight text-slate-900"
        >
          {`${data.nombre} — Detalle del cliente`}
        </h2>
      </header>
      <div data-testid="cliente-detail-description-list" className="flex flex-col">
        <DescriptionList term="Nombre" details={data.nombre} />
        <DescriptionList term="NIT/RUC" details={data.nitRuc} />
        <DescriptionList term="Teléfono" details={data.telefono} />
        <DescriptionList term="Ciudad" details={data.ciudad} />
      </div>
    </article>
  )
}
