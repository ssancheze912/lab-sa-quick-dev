import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ToastProvider, toast } from 'siesa-ui-kit'
import { zodContactoSchema, type ContactoFormData } from '../application/contactoSchema'
import { useCreateContacto } from '../application/useCreateContacto'
import { useUpdateContacto } from '../application/useUpdateContacto'
import type { Contacto } from '../domain/Contacto'

interface ContactoFormProps {
  contacto?: Contacto
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  onCancel?: () => void
}

function ContactoFormInner({ contacto, mode = 'create', onSuccess, onCancel }: ContactoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(zodContactoSchema),
    defaultValues:
      mode === 'edit' && contacto
        ? {
            nombre: contacto.nombre,
            cargo: contacto.cargo,
            telefono: contacto.telefono,
            email: contacto.email,
          }
        : undefined,
  })

  const createMutation = useCreateContacto({
    onSuccess: () => {
      toast.success('Contacto creado correctamente')
      onSuccess?.()
    },
  })
  const updateMutation = useUpdateContacto({ onSuccess })

  const isPending = mode === 'edit' ? updateMutation.isPending : createMutation.isPending

  const onSubmit = (data: ContactoFormData) => {
    if (mode === 'edit' && contacto) {
      updateMutation.mutate(
        { id: contacto.id, data },
        {
          onSuccess: () => {
            toast.success('Contacto actualizado correctamente')
          },
          onError: () => {
            toast.error('Error al actualizar el contacto')
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onError: () => {
          toast.error('Error al crear el contacto')
        },
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="contacto-nombre">Nombre</label>
        <input
          id="contacto-nombre"
          data-testid="contacto-form-nombre"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? 'error-nombre' : undefined}
          {...register('nombre')}
        />
        {errors.nombre && (
          <span id="error-nombre" data-testid="contacto-form-error-nombre" role="alert">
            {errors.nombre.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="contacto-cargo">Cargo</label>
        <input
          id="contacto-cargo"
          data-testid="contacto-form-cargo"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.cargo}
          aria-describedby={errors.cargo ? 'error-cargo' : undefined}
          {...register('cargo')}
        />
        {errors.cargo && (
          <span id="error-cargo" data-testid="contacto-form-error-cargo" role="alert">
            {errors.cargo.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="contacto-telefono">Teléfono</label>
        <input
          id="contacto-telefono"
          data-testid="contacto-form-telefono"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.telefono}
          aria-describedby={errors.telefono ? 'error-telefono' : undefined}
          {...register('telefono')}
        />
        {errors.telefono && (
          <span id="error-telefono" data-testid="contacto-form-error-telefono" role="alert">
            {errors.telefono.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="contacto-email">Email</label>
        <input
          id="contacto-email"
          data-testid="contacto-form-email"
          type="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'error-email' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id="error-email" data-testid="contacto-form-error-email" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <button
          type="submit"
          data-testid="contacto-form-submit"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          data-testid="contacto-form-cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function ContactoForm(props: ContactoFormProps) {
  return (
    <ToastProvider>
      <ContactoFormInner {...props} />
    </ToastProvider>
  )
}
