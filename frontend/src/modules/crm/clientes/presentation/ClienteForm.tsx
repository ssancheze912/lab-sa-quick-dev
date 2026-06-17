import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, toast } from 'siesa-ui-kit';
import { clienteSchema } from '../application/clienteSchema';
import type { ClienteFormValues } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';
import type { Cliente } from '../domain/Cliente';

interface ClienteFormProps {
  onSuccess?: (cliente: Cliente) => void;
  onClose: () => void;
}

export function ClienteForm({ onSuccess, onClose }: ClienteFormProps) {
  const { mutateAsync, isPending } = useCreateCliente();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      const created = await mutateAsync(data);
      toast.success('Cliente creado correctamente');
      onSuccess?.(created);
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 409) {
        setError('nitRuc', { message: 'El NIT/RUC ya está registrado' });
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.');
      }
    }
  };

  return (
    <form
      data-testid="cliente-form"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Formulario de nuevo cliente"
      className="flex flex-col gap-4"
    >
      <div>
        <Input
          id="nombre"
          data-testid="input-nombre"
          label="Nombre"
          inputSize="base"
          error={!!errors.nombre}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          {...register('nombre')}
        />
        {errors.nombre && (
          <p id="nombre-error" data-testid="error-nombre" role="alert" className="text-xs text-red-600 mt-1">
            {errors.nombre.message}
          </p>
        )}
      </div>

      <div>
        <Input
          id="nitRuc"
          data-testid="input-nitruc"
          label="NIT/RUC"
          inputSize="base"
          error={!!errors.nitRuc}
          aria-describedby={errors.nitRuc ? 'nitRuc-error' : undefined}
          {...register('nitRuc')}
        />
        {errors.nitRuc && (
          <p id="nitRuc-error" data-testid="error-nitruc" role="alert" className="text-xs text-red-600 mt-1">
            {errors.nitRuc.message}
          </p>
        )}
      </div>

      <div>
        <Input
          id="telefono"
          data-testid="input-telefono"
          label="Teléfono"
          inputSize="base"
          error={!!errors.telefono}
          aria-describedby={errors.telefono ? 'telefono-error' : undefined}
          {...register('telefono')}
        />
        {errors.telefono && (
          <p id="telefono-error" data-testid="error-telefono" role="alert" className="text-xs text-red-600 mt-1">
            {errors.telefono.message}
          </p>
        )}
      </div>

      <div>
        <Input
          id="ciudad"
          data-testid="input-ciudad"
          label="Ciudad"
          inputSize="base"
          error={!!errors.ciudad}
          aria-describedby={errors.ciudad ? 'ciudad-error' : undefined}
          {...register('ciudad')}
        />
        {errors.ciudad && (
          <p id="ciudad-error" data-testid="error-ciudad" role="alert" className="text-xs text-red-600 mt-1">
            {errors.ciudad.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="outline"
          htmlType="button"
          data-testid="btn-cancelar"
          onClick={onClose}
          ariaLabel="Cancelar creación de cliente"
        >
          Cancelar
        </Button>
        <Button
          type="default"
          htmlType="submit"
          data-testid="btn-guardar"
          disabled={isPending}
          ariaLabel="Guardar cliente"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
