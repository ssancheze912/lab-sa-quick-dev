import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactoSchema, type ContactoFormValues } from '../application/contactoSchema'
import { useCreateContacto } from '../application/useCreateContacto'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactoFormDialog({ open, onOpenChange }: Props) {
  const { mutate, isPending, error } = useCreateContacto()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
  })

  const onSubmit = (data: ContactoFormValues) => {
    mutate(data, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content
          data-testid="contacto-form-dialog"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
        >
          <Dialog.Title className="text-lg font-bold mb-4">Nuevo contacto</Dialog.Title>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                Nombre
              </label>
              <input
                id="nombre"
                data-testid="input-nombre"
                {...register('nombre')}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Nombre completo"
              />
              {errors.nombre && (
                <p role="alert" data-testid="error-nombre" className="text-xs text-red-500">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="cargo" className="text-sm font-medium text-slate-700">
                Cargo
              </label>
              <input
                id="cargo"
                data-testid="input-cargo"
                {...register('cargo')}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Cargo en la empresa"
              />
              {errors.cargo && (
                <p role="alert" data-testid="error-cargo" className="text-xs text-red-500">
                  {errors.cargo.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="telefono" className="text-sm font-medium text-slate-700">
                Teléfono
              </label>
              <input
                id="telefono"
                data-testid="input-telefono"
                {...register('telefono')}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="+57 1 234 5678"
              />
              {errors.telefono && (
                <p role="alert" data-testid="error-telefono" className="text-xs text-red-500">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                data-testid="input-email"
                type="email"
                {...register('email')}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="correo@empresa.com"
              />
              {errors.email && (
                <p role="alert" data-testid="error-email" className="text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-500">
                No se pudo crear el contacto. Intenta nuevamente.
              </p>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                data-testid="btn-cancelar"
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="btn-guardar"
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-md bg-[#0e79fd] text-white hover:bg-[#154ca9] disabled:opacity-50"
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
