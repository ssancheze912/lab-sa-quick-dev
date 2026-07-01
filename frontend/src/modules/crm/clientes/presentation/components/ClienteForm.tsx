import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from 'siesa-ui-kit'
import { clienteSchema, type ClienteFormValues } from '@/modules/crm/clientes/application/clienteSchema'
import { useCreateCliente } from '@/modules/crm/clientes/application/hooks/useCreateCliente'
import { useUpdateCliente } from '@/modules/crm/clientes/application/hooks/useUpdateCliente'

const CONFLICT_MESSAGE = 'El NIT/RUC ya está registrado'

interface ClienteFormProps {
  mode: 'create' | 'edit'
  id?: string
  initialValues?: ClienteFormValues
  onSuccess?: () => void
  onCancel?: () => void
}

const FIELD_ORDER = ['nombre', 'nit', 'telefono', 'ciudad'] as const

export function ClienteForm({ mode, id, initialValues, onSuccess, onCancel }: ClienteFormProps) {
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente(id ?? '')
  const mutation = mode === 'edit' ? updateCliente : createCliente
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialValues ?? { nombre: '', nit: '', telefono: '', ciudad: '' },
  })

  // Only the first invalid field (form order) renders its message text, so a
  // single inline error is visible at a time — every invalid field still
  // gets the red `error` border via the `error` prop below.
  const firstInvalidField = FIELD_ORDER.find((field) => errors[field])

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      await mutation.mutateAsync(data)
      onSuccess?.()
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('nit', { type: 'manual', message: CONFLICT_MESSAGE })
        return
      }
      // Non-409 failures are surfaced via toast.error inside the mutation hook.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input
        id="nombre"
        label="Nombre"
        error={!!errors.nombre}
        errorMessage={firstInvalidField === 'nombre' ? errors.nombre?.message : undefined}
        {...register('nombre')}
      />
      <Input
        id="nit"
        label="NIT/RUC"
        error={!!errors.nit}
        errorMessage={firstInvalidField === 'nit' ? errors.nit?.message : undefined}
        {...register('nit')}
      />
      <Input
        id="telefono"
        label="Teléfono"
        error={!!errors.telefono}
        errorMessage={firstInvalidField === 'telefono' ? errors.telefono?.message : undefined}
        {...register('telefono')}
      />
      <Input
        id="ciudad"
        label="Ciudad"
        error={!!errors.ciudad}
        errorMessage={firstInvalidField === 'ciudad' ? errors.ciudad?.message : undefined}
        {...register('ciudad')}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="outline" htmlType="button" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button htmlType="submit" disabled={mutation.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
