import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from 'siesa-ui-kit'
import { contactoSchema, type ContactoFormValues } from '@/modules/crm/contactos/application/contactoSchema'
import { useCreateContacto } from '@/modules/crm/contactos/application/hooks/useCreateContacto'

interface ContactoFormProps {
  mode: 'create' | 'edit'
  id?: string
  initialValues?: ContactoFormValues
  onSuccess?: () => void
  onCancel?: () => void
}

const FIELD_ORDER = ['nombre', 'cargo', 'telefono', 'email'] as const

interface ValidationProblemDetails {
  errors?: Record<string, string[]>
}

export function ContactoForm({ mode, id: _id, initialValues, onSuccess, onCancel }: ContactoFormProps) {
  const createContacto = useCreateContacto()
  // Story 3.4 (edit mode) will add a sibling `useUpdateContacto` mutation and
  // wire it in here, mirroring `ClienteForm`'s `mode === 'edit'` branch — only
  // the create path is implemented in this story.
  const mutation = createContacto
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: initialValues ?? { nombre: '', cargo: '', telefono: '', email: '' },
  })

  // Only the first invalid field (form order) renders its message text, so a
  // single inline error is visible at a time — every invalid field still
  // gets the red `error` border via the `error` prop below.
  const firstInvalidField = FIELD_ORDER.find((field) => errors[field])

  const onSubmit = async (data: ContactoFormValues) => {
    try {
      await mutation.mutateAsync(data)
      onSuccess?.()
    } catch (error) {
      if (isAxiosError<ValidationProblemDetails>(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data?.errors ?? {}
        for (const field of FIELD_ORDER) {
          const messages = Object.entries(fieldErrors).find(
            ([key]) => key.toLowerCase() === field,
          )?.[1]
          if (messages?.length) {
            setError(field, { type: 'manual', message: messages[0] })
          }
        }
        return
      }
      // Non-400 failures are surfaced via toast.error inside the mutation hook.
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
        id="cargo"
        label="Cargo"
        error={!!errors.cargo}
        errorMessage={firstInvalidField === 'cargo' ? errors.cargo?.message : undefined}
        {...register('cargo')}
      />
      <Input
        id="telefono"
        label="Teléfono"
        error={!!errors.telefono}
        errorMessage={firstInvalidField === 'telefono' ? errors.telefono?.message : undefined}
        {...register('telefono')}
      />
      <Input
        id="email"
        label="Email"
        error={!!errors.email}
        errorMessage={firstInvalidField === 'email' ? errors.email?.message : undefined}
        {...register('email')}
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
