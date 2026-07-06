import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { Button, Input } from 'siesa-ui-kit'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useCreateCliente } from '@/modules/crm/clientes/application/useCreateCliente'
import { clienteSchema, type ClienteFormValues } from '@/modules/crm/clientes/application/clienteSchema'

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClienteForm({ open, onOpenChange }: ClienteFormProps) {
  const createCliente = useCreateCliente()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCliente.mutateAsync(values)
      reset()
      onOpenChange(false)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('nit', { type: 'manual', message: 'El NIT/RUC ya está registrado' })
        return
      }
      setError('root', { type: 'manual', message: 'No se pudo guardar. Intenta de nuevo.' })
    }
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Nombre"
            required
            error={!!errors.nombre}
            errorMessage={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            label="NIT/RUC"
            required
            error={!!errors.nit}
            errorMessage={errors.nit?.message}
            {...register('nit')}
          />
          <Input
            label="Teléfono"
            required
            error={!!errors.telefono}
            errorMessage={errors.telefono?.message}
            {...register('telefono')}
          />
          <Input
            label="Ciudad"
            required
            error={!!errors.ciudad}
            errorMessage={errors.ciudad?.message}
            {...register('ciudad')}
          />

          {errors.root?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button type="outline" htmlType="button" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button htmlType="submit" disabled={createCliente.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
