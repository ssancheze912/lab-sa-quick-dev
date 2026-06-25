import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'siesa-ui-kit';
import { createClienteSchema, updateClienteSchema, type CreateClienteData, type UpdateClienteData } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';
import { useUpdateCliente } from '../application/useUpdateCliente';
import type { Cliente } from '../domain/Cliente';

interface ClienteFormCreateProps {
  mode: 'create';
  initialData?: never;
  clienteId?: never;
  onSuccess: () => void;
  onCancel: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

interface ClienteFormEditProps {
  mode: 'edit';
  initialData: Pick<Cliente, 'nombre' | 'nit' | 'telefono' | 'ciudad'>;
  clienteId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

type ClienteFormProps = ClienteFormCreateProps | ClienteFormEditProps;

type FormData = CreateClienteData | UpdateClienteData;

export function ClienteForm({ mode, initialData, clienteId, onSuccess, onCancel, onNotify }: ClienteFormProps) {
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente(clienteId ?? '');

  const { mutate: createMutate, isPending: isCreatePending } = createMutation;
  const { mutate: updateMutate, isPending: isUpdatePending } = updateMutation;

  const isPending = mode === 'create' ? isCreatePending : isUpdatePending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mode === 'create' ? createClienteSchema : updateClienteSchema),
    defaultValues: initialData,
  });

  function onSubmit(data: FormData) {
    if (mode === 'create') {
      createMutate(data as CreateClienteData, {
        onSuccess: () => {
          const msg = 'Cliente creado correctamente';
          toast.success(msg);
          onNotify?.('success', msg);
          onSuccess();
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' });
          } else {
            const msg = 'No se pudo crear el cliente. Intenta de nuevo.';
            toast.error(msg);
            onNotify?.('error', msg);
          }
        },
      });
    } else {
      updateMutate(data as UpdateClienteData, {
        onSuccess: () => {
          const msg = 'Cliente actualizado correctamente';
          toast.success(msg);
          onNotify?.('success', msg);
          onSuccess();
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' });
          } else {
            const msg = 'No se pudo actualizar el cliente. Intenta de nuevo.';
            toast.error(msg);
            onNotify?.('error', msg);
          }
        },
      });
    }
  }

  const isEditMode = mode === 'edit';
  const formTestId = isEditMode ? 'cliente-edit-form' : 'cliente-form';
  const formAriaLabel = isEditMode ? 'Editar cliente' : 'Formulario para crear cliente';
  const submitLabel = isEditMode ? 'Guardar cambios' : 'Guardar';
  const submitAriaLabel = isPending
    ? 'Guardando cliente'
    : (isEditMode ? 'Guardar cambios del cliente' : 'Crear cliente');
  const headingText = isEditMode ? 'Editar cliente' : 'Nuevo cliente';

  return (
    <form
      data-testid={formTestId}
      onSubmit={handleSubmit(onSubmit)}
      aria-label={formAriaLabel}
      className="flex flex-col gap-4 p-6"
      noValidate
    >
      <h2 className="text-lg font-bold text-slate-900">{headingText}</h2>

      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-normal text-slate-700">
          Nombre
        </label>
        <input
          data-testid="input-nombre"
          id="nombre"
          type="text"
          placeholder="Nombre de la empresa"
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          aria-invalid={!!errors.nombre}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          {...register('nombre')}
        />
        {errors.nombre && (
          <span data-testid="error-nombre" id="nombre-error" role="alert" className="text-xs text-red-600">
            {errors.nombre.message}
          </span>
        )}
      </div>

      {/* NIT/RUC */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nit" className="text-sm font-normal text-slate-700">
          NIT/RUC
        </label>
        <input
          data-testid="input-nit"
          id="nit"
          type="text"
          placeholder="Número de identificación tributaria"
          aria-describedby={errors.nit ? 'nit-error' : undefined}
          aria-invalid={!!errors.nit}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          {...register('nit')}
        />
        {errors.nit && (
          <span data-testid="error-nit" id="nit-error" role="alert" className="text-xs text-red-600">
            {errors.nit.message}
          </span>
        )}
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1">
        <label htmlFor="telefono" className="text-sm font-normal text-slate-700">
          Teléfono
        </label>
        <input
          data-testid="input-telefono"
          id="telefono"
          type="text"
          placeholder="Número de teléfono"
          aria-describedby={errors.telefono ? 'telefono-error' : undefined}
          aria-invalid={!!errors.telefono}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          {...register('telefono')}
        />
        {errors.telefono && (
          <span data-testid="error-telefono" id="telefono-error" role="alert" className="text-xs text-red-600">
            {errors.telefono.message}
          </span>
        )}
      </div>

      {/* Ciudad */}
      <div className="flex flex-col gap-1">
        <label htmlFor="ciudad" className="text-sm font-normal text-slate-700">
          Ciudad
        </label>
        <input
          data-testid="input-ciudad"
          id="ciudad"
          type="text"
          placeholder="Ciudad"
          aria-describedby={errors.ciudad ? 'ciudad-error' : undefined}
          aria-invalid={!!errors.ciudad}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          {...register('ciudad')}
        />
        {errors.ciudad && (
          <span data-testid="error-ciudad" id="ciudad-error" role="alert" className="text-xs text-red-600">
            {errors.ciudad.message}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          data-testid="btn-submit-cliente"
          type="submit"
          disabled={isPending}
          aria-label={submitAriaLabel}
          className="flex-1 rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-bold text-white hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Guardando…' : submitLabel}
        </button>
        <button
          data-testid="btn-cancelar-cliente"
          type="button"
          onClick={onCancel}
          aria-label="Cancelar y cerrar formulario"
          className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
