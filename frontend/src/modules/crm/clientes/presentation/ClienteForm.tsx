import { forwardRef } from 'react'
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

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
 * "Nuevo cliente" modal form. Story 2.3.
 *
 * - All four fields required at the form layer (Zod).
 * - Submit calls POST /api/v1/clientes via `useCreateCliente`.
 * - On success: success toast + reset + close dialog.
 * - On 409 (duplicate NIT): inline error on the `nit` field, modal stays open.
 * - On 400 (FluentValidation): inline errors mapped per field.
 * - On 5xx / network: red toast, modal stays open with values intact.
 */
export function ClienteForm({ open, onOpenChange }: ClienteFormProps) {
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
    defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
  })

  const mutation = useCreateCliente()

  function handleCancel() {
    reset()
    onOpenChange(false)
  }

  function onSubmit(values: ClienteFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Cliente creado correctamente', { duration: 3000 })
        reset()
        onOpenChange(false)
      },
      onError: (err) => {
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
        }

        toast.error('No se pudo guardar. Intenta de nuevo.', { duration: 5000 })
      },
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
          <DialogTitle>Nuevo cliente</DialogTitle>
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
              disabled={mutation.isPending}
              className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9] disabled:opacity-60"
            >
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
