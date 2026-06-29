import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ToastProvider, toast } from 'siesa-ui-kit'
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { useUpdateCliente } from '../application/useUpdateCliente'
import type { Cliente } from '../domain/Cliente'

interface ClienteFormProps {
  cliente?: Cliente
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  onCancel?: () => void
}

function ClienteFormInner({ cliente, mode = 'create', onSuccess, onCancel }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues:
      mode === 'edit' && cliente
        ? { nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }
        : undefined,
  })

  const createMutation = useCreateCliente({ onSuccess })
  const updateMutation = useUpdateCliente({ onSuccess })

  const isPending = mode === 'edit' ? updateMutation.isPending : createMutation.isPending

  const onSubmit = (data: ClienteFormData) => {
    if (mode === 'edit' && cliente) {
      updateMutation.mutate(
        { id: cliente.id, data },
        {
          onSuccess: () => {
            toast.success('Cliente actualizado correctamente')
          },
          onError: () => {
            toast.error('Error al actualizar el cliente')
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Cliente creado correctamente')
        },
        onError: (error: unknown) => {
          const axiosError = error as { response?: { status?: number } }
          if (axiosError?.response?.status === 409) {
            setError('nit', { message: 'El NIT/RUC ya está registrado' })
          } else {
            toast.error('Error al crear el cliente')
          }
        },
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="cliente-nombre">Nombre</label>
        <input
          id="cliente-nombre"
          data-testid="cliente-form-nombre"
          type="text"
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? 'error-nombre' : undefined}
          {...register('nombre')}
        />
        {errors.nombre && (
          <span id="error-nombre" data-testid="cliente-form-error-nombre" role="alert">
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
          aria-invalid={!!errors.nit}
          aria-describedby={errors.nit ? 'error-nit' : undefined}
          {...register('nit')}
        />
        {errors.nit && (
          <span id="error-nit" data-testid="cliente-form-error-nit" role="alert">
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
          aria-invalid={!!errors.telefono}
          aria-describedby={errors.telefono ? 'error-telefono' : undefined}
          {...register('telefono')}
        />
        {errors.telefono && (
          <span id="error-telefono" data-testid="cliente-form-error-telefono" role="alert">
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
          aria-invalid={!!errors.ciudad}
          aria-describedby={errors.ciudad ? 'error-ciudad' : undefined}
          {...register('ciudad')}
        />
        {errors.ciudad && (
          <span id="error-ciudad" data-testid="cliente-form-error-ciudad" role="alert">
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
