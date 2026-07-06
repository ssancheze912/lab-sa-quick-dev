import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
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
import { useUpdateCliente } from '@/modules/crm/clientes/application/useUpdateCliente'
import { clienteSchema, type ClienteFormValues } from '@/modules/crm/clientes/application/clienteSchema'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
}

export function ClienteForm({ open, onOpenChange, cliente }: ClienteFormProps) {
  const isEditMode = !!cliente
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
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

  useEffect(() => {
    if (open) {
      reset(
        cliente
          ? { nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }
          : { nombre: '', nit: '', telefono: '', ciudad: '' },
      )
    }
  }, [open, cliente, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditMode) {
        await updateCliente.mutateAsync({ id: cliente!.id, data: values })
      } else {
        await createCliente.mutateAsync(values)
      }
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
          <DialogTitle>{isEditMode ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
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
            <Button htmlType="submit" disabled={isEditMode ? updateCliente.isPending : createCliente.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
