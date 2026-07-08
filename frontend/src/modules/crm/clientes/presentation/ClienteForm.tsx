import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Input } from 'siesa-ui-kit'
import type { HTMLAttributes, InputHTMLAttributes, ReactElement, Ref } from 'react'
import { forwardRef } from 'react'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import type { CreateClienteError } from '../application/useCreateCliente'
import type { UpdateClienteError } from '../application/useUpdateCliente'

/**
 * Union of every mutation-error shape the form accepts. Story 2.3 introduced
 * the Create variant; Story 2.4 widens it to also accept Update (which adds
 * the `not-found` kind).
 */
export type ClienteFormSubmitError = CreateClienteError | UpdateClienteError

export interface ClienteFormProps {
  onSubmit: (values: ClienteFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
  /** Error surfaced by the mutation — drives inline (409) vs. top-of-form (network/404) rendering. */
  submitError: ClienteFormSubmitError | null
  defaultValues?: Partial<ClienteFormValues>
  submitLabel?: string
}

/**
 * Controlled form for creating (Story 2.3) and later editing (Story 2.4) a
 * cliente. Wires React Hook Form + Zod. The submit-error surface is driven by
 * the `submitError` prop, classified by `useCreateCliente`.
 */
export function ClienteForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  defaultValues,
  submitLabel = 'Guardar',
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      nit: defaultValues?.nit ?? '',
      telefono: defaultValues?.telefono ?? '',
      ciudad: defaultValues?.ciudad ?? '',
    },
  })

  const showGenericAlert =
    submitError !== null &&
    (submitError.kind === 'network' ||
      submitError.kind === 'validation' ||
      submitError.kind === 'not-found')

  const nitBackendError =
    submitError !== null && submitError.kind === 'nit-conflict'
      ? submitError.nitMessage
      : undefined

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
      data-testid="cliente-form"
    >
      {showGenericAlert && submitError?.generic && (
        <div data-testid="cliente-form-alert">
          <Alert
            title={submitError.generic.title}
            description={submitError.generic.subtitle}
            actions={<></>}
            className="border border-red-500 bg-red-50 text-red-900"
          />
        </div>
      )}

      <Field
        id="cliente-nombre"
        label="Nombre"
        error={errors.nombre?.message}
        {...register('nombre')}
        readOnly={isSubmitting}
        autoFocus
      />
      <Field
        id="cliente-nit"
        label="NIT/RUC"
        error={errors.nit?.message ?? nitBackendError}
        {...register('nit')}
        readOnly={isSubmitting}
      />
      <Field
        id="cliente-telefono"
        label="Teléfono"
        error={errors.telefono?.message}
        {...register('telefono')}
        readOnly={isSubmitting}
      />
      <Field
        id="cliente-ciudad"
        label="Ciudad"
        error={errors.ciudad?.message}
        {...register('ciudad')}
        readOnly={isSubmitting}
      />

      <footer className="flex items-center justify-end gap-2 pt-2">
        <Button type="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="default"
          color="primary"
          htmlType="submit"
          aria-busy={isSubmitting}
          disabled={isSubmitting}
          data-testid="cliente-form-submit"
        >
          {submitLabel}
        </Button>
      </footer>
    </form>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
}

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  props: FieldProps,
  ref: Ref<HTMLInputElement>,
): ReactElement {
  const { id, label, error, ...rest } = props
  const describedBy = error ? `${id}-error` : undefined
  const wrapperProps: HTMLAttributes<HTMLDivElement> = { className: 'space-y-1' }
  return (
    <div {...wrapperProps}>
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <Input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      />
      {error && (
        <p id={describedBy} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})
