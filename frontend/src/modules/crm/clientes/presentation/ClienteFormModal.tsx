import { forwardRef, useEffect } from 'react'
import type { InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { AlertDialog, Button, Input } from 'siesa-ui-kit'
import {
  clienteFormSchema,
  type ClienteFormValues,
} from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { useUpdateCliente } from '../application/useUpdateCliente'

/**
 * Discriminated union: `mode` decides which mutation runs, which
 * `defaultValues` are pre-loaded, and which title/toast copy fires.
 * `clienteId` + `initialValues` are only required in edit mode.
 */
export type ClienteFormModalProps =
  | {
      mode?: 'create'
      isOpen: boolean
      onClose: () => void
    }
  | {
      mode: 'edit'
      isOpen: boolean
      onClose: () => void
      clienteId: string
      initialValues: ClienteFormValues
    }

const EMPTY_VALUES: ClienteFormValues = {
  nombre: '',
  nit: '',
  telefono: '',
  ciudad: '',
}

/**
 * Modal wrapper around the create/edit-cliente form. All copy is in Spanish;
 * all identifiers are in English. Uses siesa-ui-kit AlertDialog as the a11y-safe
 * dialog container (Radix/Headless-UI backed: focus-trap, Esc-to-close).
 *
 * The form is controlled by React Hook Form with a Zod resolver so validation
 * runs `onBlur` (per UX spec Feedback Patterns) and on submit; whitespace-only
 * values fail the `.trim().min(1)` rules and render an inline error.
 */
export function ClienteFormModal(props: ClienteFormModalProps) {
  const { isOpen, onClose } = props
  // Narrow via props.mode directly so TS refines initialValues + clienteId.
  const isEdit = props.mode === 'edit'
  const initialValues: ClienteFormValues =
    props.mode === 'edit' ? props.initialValues : EMPTY_VALUES
  const clienteId = props.mode === 'edit' ? props.clienteId : ''

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
    // In edit mode, defaultValues change when the user selects a different
    // cliente. RHF only reads defaultValues on initial mount, so we ALSO
    // call reset(initialValues) inside the useEffect below whenever the
    // modal opens — that keeps the form in sync with props.
    defaultValues: initialValues,
  })

  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente(clienteId)
  const activeMutation = isEdit ? updateMutation : createMutation

  // Auto-focus Nombre when the modal opens and reset form/mutation state when
  // it closes so the next open starts clean. Depends only on `isOpen` +
  // `clienteId` — a fresh mutation object every render would loop us into OOM.
  useEffect(() => {
    if (isOpen) {
      reset(initialValues)
      const t = window.setTimeout(() => setFocus('nombre'), 0)
      return () => window.clearTimeout(t)
    }
    reset(initialValues)
    activeMutation.reset()
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit ? clienteId : null])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await activeMutation.mutateAsync(values)
      onClose()
    } catch (error) {
      // 409 → inline NIT error (both create + edit share the same copy).
      // Any other error was already toasted by the mutation hook. We do
      // NOT close the modal so the user can retry. Using axios.isAxiosError
      // is safer than an ad-hoc structural check: it guarantees `error.response`
      // is properly typed and avoids false positives on non-Axios errors that
      // happen to expose a `response` property.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
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

  const title = isEdit ? 'Editar cliente' : 'Nuevo cliente'

  // NOTE: siesa-ui-kit's AlertDialog does NOT render `children` — it renders
  // `title`, an optional `description` (ReactNode), and `actions` (ReactNode).
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
      title={title}
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
