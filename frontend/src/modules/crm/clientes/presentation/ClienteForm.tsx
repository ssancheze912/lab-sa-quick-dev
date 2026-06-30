import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useCreateCliente } from '../application/useCreateCliente'
import { createClienteSchema, type CreateClienteFormData } from '../application/clienteSchema'

interface ClienteFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export function ClienteForm({ onClose, onSuccess }: ClienteFormProps) {
  const { mutate, isPending } = useCreateCliente({
    onSuccess: () => {
      onSuccess?.()
      onClose()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClienteFormData>({
    resolver: zodResolver(createClienteSchema),
  })

  const onSubmit = (data: CreateClienteFormData) => {
    mutate(data)
  }

  return (
    <form
      data-testid="cliente-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          placeholder="Nombre del cliente"
          aria-required="true"
          {...register('nombre')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
        {errors.nombre && (
          <p className="text-xs text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nit" className="text-sm font-medium text-slate-700">
          NIT/RUC
        </label>
        <input
          id="nit"
          type="text"
          placeholder="NIT o RUC del cliente"
          aria-required="true"
          {...register('nit')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
        {errors.nit && (
          <p className="text-xs text-red-500">{errors.nit.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="telefono" className="text-sm font-medium text-slate-700">
          Teléfono
        </label>
        <input
          id="telefono"
          type="text"
          placeholder="Teléfono de contacto"
          aria-required="true"
          {...register('telefono')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
        {errors.telefono && (
          <p className="text-xs text-red-500">{errors.telefono.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ciudad" className="text-sm font-medium text-slate-700">
          Ciudad
        </label>
        <input
          id="ciudad"
          type="text"
          placeholder="Ciudad del cliente"
          aria-required="true"
          {...register('ciudad')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
        {errors.ciudad && (
          <p className="text-xs text-red-500">{errors.ciudad.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          data-testid="cliente-form-submit"
          disabled={isPending}
          className="flex items-center gap-1 rounded-md bg-[#0e79fd] px-4 py-2 text-sm text-white hover:bg-[#154ca9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Guardar
        </button>
      </div>
    </form>
  )
}
