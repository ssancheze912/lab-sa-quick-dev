import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from 'siesa-ui-kit'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

interface ClienteFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultValues?: Partial<ClienteFormValues>
}

export function ClienteForm({ onSuccess, onCancel, defaultValues }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  })

  const { mutate, isPending } = useCreateCliente()

  const onSubmit = (values: ClienteFormValues) => {
    mutate(values, {
      onSuccess: () => {
        reset()
        onSuccess?.()
      },
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Crear nuevo cliente"
      data-testid="cliente-form"
      className="flex flex-col gap-4"
    >
      <div>
        <Input
          id="nombre"
          label="Nombre"
          data-testid="field-nombre"
          error={!!errors.nombre}
          errorMessage={errors.nombre?.message}
          {...register('nombre')}
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="nit"
          label="NIT/RUC"
          data-testid="field-nit"
          error={!!errors.nit}
          errorMessage={errors.nit?.message}
          {...register('nit')}
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="telefono"
          label="Teléfono"
          data-testid="field-telefono"
          error={!!errors.telefono}
          errorMessage={errors.telefono?.message}
          {...register('telefono')}
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="ciudad"
          label="Ciudad"
          data-testid="field-ciudad"
          error={!!errors.ciudad}
          errorMessage={errors.ciudad?.message}
          {...register('ciudad')}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          htmlType="button"
          type="outline"
          data-testid="cancel-button"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          htmlType="submit"
          type="default"
          data-testid="submit-button"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
