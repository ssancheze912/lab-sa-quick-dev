import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from 'siesa-ui-kit'
import { clienteSchema, type ClienteFormValues } from '@/modules/crm/clientes/application/clienteSchema'
import { useCreateCliente } from '@/modules/crm/clientes/application/hooks/useCreateCliente'

const CONFLICT_MESSAGE = 'El NIT/RUC ya está registrado'

interface ClienteFormProps {
  mode: 'create' | 'edit'
  initialValues?: ClienteFormValues
  onSuccess?: () => void
}

const FIELD_ORDER = ['nombre', 'nit', 'telefono', 'ciudad'] as const

export function ClienteForm({ mode: _mode, initialValues, onSuccess }: ClienteFormProps) {
  const createCliente = useCreateCliente()
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
      await createCliente.mutateAsync(data)
      onSuccess?.()
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('nit', { type: 'manual', message: CONFLICT_MESSAGE })
        return
      }
      // Non-409 failures are surfaced via toast.error inside useCreateCliente.
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
        <Button htmlType="submit" disabled={createCliente.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
