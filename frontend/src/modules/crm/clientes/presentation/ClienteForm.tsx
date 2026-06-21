import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';

interface ClienteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  const { mutate, isPending } = useCreateCliente((message) =>
    setError('nit', { message })
  );

  const onSubmit = (data: ClienteFormData) => {
    mutate(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Nombre */}
      <div>
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          placeholder="Nombre de la empresa o persona"
          {...register('nombre')}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400 min-h-[44px]"
        />
        {errors.nombre && (
          <span
            id="nombre-error"
            role="alert"
            className="text-xs text-red-600 mt-1 block"
          >
            {errors.nombre.message}
          </span>
        )}
      </div>

      {/* NIT/RUC */}
      <div>
        <label
          htmlFor="nit"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          NIT/RUC
        </label>
        <input
          id="nit"
          type="text"
          placeholder="Ej: 900123456-1"
          {...register('nit')}
          aria-describedby={errors.nit ? 'nit-error' : undefined}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400 min-h-[44px]"
        />
        {errors.nit && (
          <span
            id="nit-error"
            role="alert"
            className="text-xs text-red-600 mt-1 block"
          >
            {errors.nit.message}
          </span>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label
          htmlFor="telefono"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Teléfono
        </label>
        <input
          id="telefono"
          type="tel"
          placeholder="Ej: +573001234567"
          {...register('telefono')}
          aria-describedby={errors.telefono ? 'telefono-error' : undefined}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400 min-h-[44px]"
        />
        {errors.telefono && (
          <span
            id="telefono-error"
            role="alert"
            className="text-xs text-red-600 mt-1 block"
          >
            {errors.telefono.message}
          </span>
        )}
      </div>

      {/* Ciudad */}
      <div>
        <label
          htmlFor="ciudad"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Ciudad
        </label>
        <input
          id="ciudad"
          type="text"
          placeholder="Ej: Bogotá"
          {...register('ciudad')}
          aria-describedby={errors.ciudad ? 'ciudad-error' : undefined}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400 min-h-[44px]"
        />
        {errors.ciudad && (
          <span
            id="ciudad-error"
            role="alert"
            className="text-xs text-red-600 mt-1 block"
          >
            {errors.ciudad.message}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 min-h-[44px]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? 'Guardando cliente' : 'Guardar cliente'}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isPending ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  );
}
