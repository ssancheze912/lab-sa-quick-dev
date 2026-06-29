import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ToastProvider, toast } from 'siesa-ui-kit'
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

interface ClienteFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

function ClienteFormInner({ onSuccess, onCancel }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  })

  const { mutate, isPending } = useCreateCliente({ onSuccess })

  const onSubmit = (data: ClienteFormData) => {
    mutate(data, {
      onSuccess: () => {
        toast.success('Cliente creado correctamente')
      },
      onError: (error: unknown) => {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError?.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' })
        }
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="cliente-nombre">Nombre</label>
        <input
          id="cliente-nombre"
          data-testid="cliente-form-nombre"
          type="text"
          {...register('nombre')}
        />
        {errors.nombre && (
          <span data-testid="cliente-form-error-nombre" role="alert">
            {errors.nombre.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="cliente-nit">NIT/RUC</label>
        <input
          id="cliente-nit"
          data-testid="cliente-form-nit"
          type="text"
          {...register('nit')}
        />
        {errors.nit && (
          <span data-testid="cliente-form-error-nit" role="alert">
            {errors.nit.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="cliente-telefono">Teléfono</label>
        <input
          id="cliente-telefono"
          data-testid="cliente-form-telefono"
          type="text"
          {...register('telefono')}
        />
        {errors.telefono && (
          <span data-testid="cliente-form-error-telefono" role="alert">
            {errors.telefono.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="cliente-ciudad">Ciudad</label>
        <input
          id="cliente-ciudad"
          data-testid="cliente-form-ciudad"
          type="text"
          {...register('ciudad')}
        />
        {errors.ciudad && (
          <span data-testid="cliente-form-error-ciudad" role="alert">
            {errors.ciudad.message}
          </span>
        )}
      </div>

      <div>
        <button
          type="submit"
          data-testid="cliente-form-submit"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          data-testid="cliente-form-cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function ClienteForm(props: ClienteFormProps) {
  return (
    <ToastProvider>
      <ClienteFormInner {...props} />
    </ToastProvider>
  )
}
