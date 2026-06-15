import { forwardRef, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { toast } from 'siesa-ui-kit'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { clienteFormSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { useUpdateCliente } from '../application/useUpdateCliente'
import type { Cliente } from '../domain/Cliente'

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Defaults to `'create'` (back-compatible with Story 2.3). In `'edit'` mode
   * the dialog title becomes `Editar cliente` and the form is pre-filled from
   * the `cliente` prop.
   */
  mode?: 'create' | 'edit'
  /** Required when `mode === 'edit'`. */
  cliente?: Cliente
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  required?: boolean
  error?: string
  testId: string
}

/**
 * Form input + label + inline error wrapper. Mounted inside `ClienteForm`.
 * `forwardRef` so react-hook-form's `register` ref attaches correctly.
 */
const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, required, error, testId, id, ...inputProps }, ref) => {
    const inputId = id ?? `cliente-field-${testId}`
    const errorId = `${inputId}-error`
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            'rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40',
            error ? 'border-red-500' : 'border-slate-300',
          ].join(' ')}
          {...inputProps}
        />
        {error ? (
          <p
            id={errorId}
            data-testid={testId}
            className="text-sm text-red-600 mt-1"
          >
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
Field.displayName = 'ClienteFormField'

/**
 * Cliente form modal. Story 2.3 (create) + Story 2.4 (edit).
 *
 * - All four fields required at the form layer (Zod).
 * - Create mode: POST /api/v1/clientes via `useCreateCliente`.
 * - Edit mode: PUT /api/v1/clientes/{id} via `useUpdateCliente`.
 * - On success: success toast (Spanish copy) + close dialog.
 * - On 409 (duplicate NIT): inline error on the `nit` field, modal stays open.
 * - On 400 (FluentValidation): inline errors mapped per field, modal stays open.
 * - On 404 (edit only): red toast, modal closes (record vanished).
 * - On 5xx / network: red toast, modal stays open with values intact.
 */
export function ClienteForm({
  open,
  onOpenChange,
  mode = 'create',
  cliente,
}: ClienteFormProps) {
  const defaultValues = useMemo<ClienteFormValues>(() => {
    if (mode === 'edit' && cliente) {
      return {
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono ?? '',
        ciudad: cliente.ciudad ?? '',
      }
    }
    return { nombre: '', nit: '', telefono: '', ciudad: '' }
  }, [mode, cliente])

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
  })

  // CRITICAL — reset on open transition (AC #6). Forces the form back to the
  // latest pristine `cliente` prop values whenever the dialog re-opens so
  // "open → mutate field → Cancelar → re-open" shows the ORIGINAL values, not
  // a stale draft (R-006 mitigation).
  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, defaultValues, reset])

  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()
  const isPending =
    mode === 'edit' ? updateMutation.isPending : createMutation.isPending

  function handleCancel() {
    reset(defaultValues)
    onOpenChange(false)
  }

  function handleMutationError(err: unknown, closeOnNotFound: boolean) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        setError('nit', { message: 'El NIT/RUC ya está registrado' })
        return
      }

      if (err.response?.status === 400) {
        const data = err.response.data as
          | { errors?: Record<string, string[]> }
          | undefined
        const fieldErrors = data?.errors
        if (fieldErrors) {
          let mapped = false
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            const key = field.toLowerCase() as keyof ClienteFormValues
            if (
              key === 'nombre' ||
              key === 'nit' ||
              key === 'telefono' ||
              key === 'ciudad'
            ) {
              setError(key, { message: msgs[0] ?? 'Valor inválido' })
              mapped = true
            }
          }
          if (mapped) return
        }
      }

      if (closeOnNotFound && err.response?.status === 404) {
        toast.error('No se pudo guardar. Intenta de nuevo.', { duration: 5000 })
        onOpenChange(false)
        return
      }
    }

    toast.error('No se pudo guardar. Intenta de nuevo.', { duration: 5000 })
  }

  function onSubmit(values: ClienteFormValues) {
    if (mode === 'edit' && cliente) {
      updateMutation.mutate(
        { id: cliente.id, input: values },
        {
          onSuccess: () => {
            toast.success('Cliente actualizado correctamente', { duration: 3000 })
            onOpenChange(false)
          },
          onError: (err) => handleMutationError(err, /* closeOnNotFound */ true),
        },
      )
      return
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Cliente creado correctamente', { duration: 3000 })
        reset()
        onOpenChange(false)
      },
      onError: (err) => handleMutationError(err, /* closeOnNotFound */ false),
    })
  }

  // Spread `register` results so the ref + onChange/onBlur are wired.
  const nombreReg = register('nombre')
  const nitReg = register('nit')
  const telefonoReg = register('telefono')
  const ciudadReg = register('ciudad')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="cliente-form-dialog"
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field
            label="Nombre"
            required
            autoFocus
            error={errors.nombre?.message}
            testId="cliente-form-error-nombre"
            {...nombreReg}
          />
          <Field
            label="NIT/RUC"
            required
            error={errors.nit?.message}
            testId="cliente-form-error-nit"
            {...nitReg}
          />
          <Field
            label="Teléfono"
            required
            error={errors.telefono?.message}
            testId="cliente-form-error-telefono"
            {...telefonoReg}
          />
          <Field
            label="Ciudad"
            required
            error={errors.ciudad?.message}
            testId="cliente-form-error-ciudad"
            {...ciudadReg}
          />
          <p className="text-xs text-slate-500">* Campos obligatorios</p>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9] disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
