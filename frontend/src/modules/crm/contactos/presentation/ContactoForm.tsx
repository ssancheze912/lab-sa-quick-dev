import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { zodContactoSchema, type ContactoFormData } from '../application/contactoSchema'
import { useCreateContacto } from '../application/useCreateContacto'

interface ContactoFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContactoForm({ onSuccess, onCancel }: ContactoFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(zodContactoSchema),
  })

  const { mutate, isPending } = useCreateContacto({
    onSuccess: () => {
      setSuccessMessage('Contacto creado correctamente')
      setErrorMessage(null)
      onSuccess?.()
    },
  })

  const onSubmit = (data: ContactoFormData) => {
    setSuccessMessage(null)
    setErrorMessage(null)
    mutate(data, {
      onError: () => {
        setErrorMessage('Error al crear el contacto')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {successMessage && (
        <div role="status" aria-live="polite">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div role="alert" aria-live="assertive">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="contacto-nombre">Nombre</label>
        <input
          id="contacto-nombre"
          data-testid="contacto-form-nombre"
          type="text"
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
