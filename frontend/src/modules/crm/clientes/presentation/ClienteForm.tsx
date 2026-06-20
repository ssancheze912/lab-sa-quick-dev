import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from 'siesa-ui-kit'
import type { AxiosError } from 'axios'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { useUpdateCliente } from '../application/useUpdateCliente'

interface ClienteFormProps {
  mode?: 'create' | 'edit'
  clienteId?: string
  defaultValues?: ClienteFormValues
  onClose: () => void
}

export function ClienteForm({ mode = 'create', clienteId, defaultValues, onClose }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  })

  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente(clienteId ?? '')

  const mutation = mode === 'edit' ? updateMutation : createMutation

  const { mutate, isPending, isSuccess, isError, error } = mutation

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (isSuccess) {
      reset()
      onCloseRef.current()
    }
  }, [isSuccess, reset])

  useEffect(() => {
    if (isError && error) {
      const status = (error as AxiosError)?.response?.status
      if (status === 409) {
        setError('nit', { message: 'El NIT/RUC ya está registrado' })
      }
    }
  }, [isError, error, setError])

  const onSubmit = (data: ClienteFormValues) => {
    mutate(data)
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  return (
    <form
      data-testid="cliente-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="cliente-nombre"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Nombre *
          </label>
          <Input
            id="cliente-nombre"
            data-testid="cliente-nombre-input"
            placeholder="Nombre de la empresa"
            aria-describedby={errors.nombre ? 'cliente-nombre-error' : undefined}
            autoFocus
            {...register('nombre')}
          />
          {errors.nombre && (
            <p
              id="cliente-nombre-error"
              data-testid="cliente-nombre-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.nombre.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cliente-nit"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            NIT/RUC *
          </label>
          <Input
            id="cliente-nit"
            data-testid="cliente-nit-input"
            placeholder="900123456-1"
            aria-describedby={errors.nit ? 'cliente-nit-error' : undefined}
            {...register('nit')}
          />
          {errors.nit && (
            <p
              id="cliente-nit-error"
              data-testid="cliente-nit-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.nit.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cliente-telefono"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Teléfono *
          </label>
          <Input
            id="cliente-telefono"
            data-testid="cliente-telefono-input"
            placeholder="3001234567"
            aria-describedby={errors.telefono ? 'cliente-telefono-error' : undefined}
            {...register('telefono')}
          />
          {errors.telefono && (
            <p
              id="cliente-telefono-error"
              data-testid="cliente-telefono-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.telefono.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cliente-ciudad"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Ciudad *
          </label>
          <Input
            id="cliente-ciudad"
            data-testid="cliente-ciudad-input"
            placeholder="Bogotá"
            aria-describedby={errors.ciudad ? 'cliente-ciudad-error' : undefined}
            {...register('ciudad')}
          />
          {errors.ciudad && (
            <p
              id="cliente-ciudad-error"
              data-testid="cliente-ciudad-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.ciudad.message}
            </p>
          )}
        </div>
      </div>

      <p
        data-testid="campos-obligatorios-legend"
        className="mt-4 text-xs text-slate-500"
      >
        * Campos obligatorios
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          data-testid="cancelar-btn"
          onClick={handleCancel}
          className="inline-flex items-center justify-center rounded-md border border-[#93d1fd] px-4 py-2 text-sm font-medium text-[#0e79fd] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          data-testid="guardar-btn"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#154ca9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
