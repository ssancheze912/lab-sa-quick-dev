import { forwardRef, useEffect } from 'react'
import type { InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertDialog, Button, Input } from 'siesa-ui-kit'
import {
  clienteFormSchema,
  type ClienteFormValues,
} from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

export interface ClienteFormModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean
  /** Called when the user cancels, presses Esc, or the mutation completes ok. */
  onClose: () => void
}

/**
 * Modal wrapper around the create-cliente form. All copy is in Spanish; all
 * identifiers are in English. Uses siesa-ui-kit AlertDialog as the a11y-safe
 * dialog container (Radix/Headless-UI backed: focus-trap, Esc-to-close).
 *
 * The form is controlled by React Hook Form with a Zod resolver so validation
 * runs `onBlur` (per UX spec Feedback Patterns) and on submit; whitespace-only
 * values fail the `.trim().min(1)` rules and render an inline error.
 */
export function ClienteFormModal({ isOpen, onClose }: ClienteFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setFocus,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    mode: 'onBlur',
    defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
  })

  const createMutation = useCreateCliente()

  // Auto-focus Nombre when the modal opens and clear form/mutation state when
  // it closes so the next open starts clean. We deliberately depend ONLY on
  // `isOpen` — `createMutation` is a fresh object every render and would loop
  // us into OOM if listed, and `reset`/`setFocus` from RHF are stable across
  // renders per @tanstack docs.
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => setFocus('nombre'), 0)
      return () => window.clearTimeout(t)
    }
    reset()
    createMutation.reset()
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      onClose()
    } catch (error) {
      // 409 → inline NIT error. Any other error was already handled by the
      // mutation hook (toast). We do not close the modal so the user can retry.
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 409
      ) {
        setError('nit', {
          type: 'server',
          message: 'El NIT/RUC ya está registrado',
        })
        setFocus('nit')
      }
    }
  })

  if (!isOpen) {
    return null
  }

  // NOTE: siesa-ui-kit's AlertDialog does NOT render `children` — it renders
  // `title`, an optional `description` (ReactNode), and `actions` (ReactNode).
  // So we put the form inside the `description` slot and pass the buttons via
  // `actions`. The `<form id="cliente-form">` + `htmlType="submit" form="…"`
  // link the submit button to the form even though they live in different
  // subtrees of the dialog.
  const formNode = (
    <form
      id="cliente-form"
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4"
      data-testid="cliente-form-modal"
    >
      <Field
        id="nombre"
        label="Nombre"
        required
        error={errors.nombre?.message}
        testId="cliente-form-nombre"
        {...register('nombre')}
      />
      <Field
        id="nit"
        label="NIT/RUC"
        required
        error={errors.nit?.message}
        testId="cliente-form-nit"
        {...register('nit')}
      />
      <Field
        id="telefono"
        label="Teléfono"
        required
        error={errors.telefono?.message}
        testId="cliente-form-telefono"
        {...register('telefono')}
      />
      <Field
        id="ciudad"
        label="Ciudad"
        required
        error={errors.ciudad?.message}
        testId="cliente-form-ciudad"
        {...register('ciudad')}
      />
      <p className="text-xs text-slate-500">* Campos obligatorios</p>
    </form>
  )

  return (
    <AlertDialog
      isOpen={isOpen}
      title="Nuevo cliente"
      showCloseButton
      hideCancel
      size="max-w-md"
      onCancel={onClose}
      description={formNode}
      actions={
        <div className="flex justify-end gap-2">
          <Button
            htmlType="button"
            type="outline"
            onClick={onClose}
            data-testid="cliente-form-cancel"
          >
            Cancelar
          </Button>
          <Button
            htmlType="submit"
            form="cliente-form"
            type="default"
            disabled={isSubmitting}
            data-testid="cliente-form-submit"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      }
    />
  )
}

/**
 * Small inline `Field` composition that wraps siesa-ui-kit `Input` with a
 * label + inline error. Kept local because the shape is specific to this
 * modal — promote to `shared/components/` if a second form needs it.
 */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  required?: boolean
  error?: string
  testId: string
}

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, required, error, testId, ...inputProps },
  ref,
) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <Input
        id={id}
        ref={ref}
        type="text"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        data-testid={testId}
        {...inputProps}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600"
          data-testid={`${testId}-error`}
        >
          {error}
        </p>
      )}
    </div>
  )
})
