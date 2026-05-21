import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

interface ClienteFormDialogProps {
  open: boolean
  onClose: () => void
}

export function ClienteFormDialog({ open, onClose }: ClienteFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
  })

  const { mutate, isPending } = useCreateCliente()

  const onSubmit = (values: ClienteFormValues) => {
    mutate(values, {
      onSuccess: () => {
        reset()
        onClose()
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' })
        }
      },
    })
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          data-testid="cliente-form-dialog"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="text-lg font-bold text-slate-900 mb-4">
            Nuevo cliente
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                Nombre <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                data-testid="input-nombre"
                type="text"
                placeholder="Nombre de la empresa"
                aria-required="true"
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? 'error-nombre' : undefined}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
                {...register('nombre')}
              />
              {errors.nombre && (
                <p id="error-nombre" role="alert" data-testid="error-nombre" className="text-xs text-red-600">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* NIT/RUC */}
            <div className="flex flex-col gap-1">
              <label htmlFor="nit" className="text-sm font-medium text-slate-700">
                NIT/RUC <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="nit"
                data-testid="input-nit"
                type="text"
                placeholder="Ej: 900123456-7"
                aria-required="true"
                aria-invalid={!!errors.nit}
                aria-describedby={errors.nit ? 'error-nit' : undefined}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
                {...register('nit')}
              />
              {errors.nit && (
                <p id="error-nit" role="alert" data-testid="error-nit" className="text-xs text-red-600">
                  {errors.nit.message}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1">
              <label htmlFor="telefono" className="text-sm font-medium text-slate-700">
                Teléfono <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="telefono"
                data-testid="input-telefono"
                type="tel"
                placeholder="Ej: 3001234567"
                aria-required="true"
                aria-invalid={!!errors.telefono}
                aria-describedby={errors.telefono ? 'error-telefono' : undefined}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
                {...register('telefono')}
              />
              {errors.telefono && (
                <p id="error-telefono" role="alert" data-testid="error-telefono" className="text-xs text-red-600">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            {/* Ciudad */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ciudad" className="text-sm font-medium text-slate-700">
                Ciudad <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="ciudad"
                data-testid="input-ciudad"
                type="text"
                placeholder="Ej: Bogotá"
                aria-required="true"
                aria-invalid={!!errors.ciudad}
                aria-describedby={errors.ciudad ? 'error-ciudad' : undefined}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
                {...register('ciudad')}
              />
              {errors.ciudad && (
                <p id="error-ciudad" role="alert" data-testid="error-ciudad" className="text-xs text-red-600">
                  {errors.ciudad.message}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="btn-cancelar"
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="btn-guardar"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
