import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, toast } from 'siesa-ui-kit';
import { clienteFormSchema, type ClienteFormValues } from '../application/clienteSchema';
import { useUpdateCliente } from '../application/useUpdateCliente';
import type { Cliente } from '../domain/Cliente';

interface ClienteEditFormProps {
  cliente: Cliente;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClienteEditForm({ cliente, onSuccess, onCancel }: ClienteEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nombre: cliente.nombre,
      nitRuc: cliente.nitRuc,
      telefono: cliente.telefono,
      ciudad: cliente.ciudad,
    },
  });

  const { mutate, isPending } = useUpdateCliente();

  const onSubmit = (values: ClienteFormValues) => {
    mutate(
      { id: cliente.id, data: values },
      {
        onSuccess: () => {
          toast.success('Cliente actualizado correctamente');
          onSuccess();
        },
        onError: () => {
          toast.error('No se pudo actualizar el cliente. Inténtalo de nuevo.');
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Formulario de edición de cliente"
      noValidate
      className="max-w-xl p-6 space-y-4"
    >
      <div>
        <Input
          id="nombre"
          label="Nombre"
          {...register('nombre')}
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          error={!!errors.nombre}
          errorMessage={errors.nombre?.message}
        />
        {errors.nombre && (
          <span id="nombre-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1 block">
            {errors.nombre.message}
          </span>
        )}
      </div>

      <div>
        <Input
          id="nitRuc"
          label="NIT/RUC"
          {...register('nitRuc')}
          aria-invalid={!!errors.nitRuc}
          aria-describedby={errors.nitRuc ? 'nitRuc-error' : undefined}
          error={!!errors.nitRuc}
          errorMessage={errors.nitRuc?.message}
        />
        {errors.nitRuc && (
          <span id="nitRuc-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1 block">
            {errors.nitRuc.message}
          </span>
        )}
      </div>

      <div>
        <Input
          id="telefono"
          label="Teléfono"
          {...register('telefono')}
          aria-invalid={!!errors.telefono}
          aria-describedby={errors.telefono ? 'telefono-error' : undefined}
          error={!!errors.telefono}
          errorMessage={errors.telefono?.message}
        />
        {errors.telefono && (
          <span id="telefono-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1 block">
            {errors.telefono.message}
          </span>
        )}
      </div>

      <div>
        <Input
          id="ciudad"
          label="Ciudad"
          {...register('ciudad')}
          aria-invalid={!!errors.ciudad}
          aria-describedby={errors.ciudad ? 'ciudad-error' : undefined}
          error={!!errors.ciudad}
          errorMessage={errors.ciudad?.message}
        />
        {errors.ciudad && (
          <span id="ciudad-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1 block">
            {errors.ciudad.message}
          </span>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          htmlType="button"
          type="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          htmlType="submit"
          type="default"
          disabled={isPending}
          ariaLabel="Guardar cambios del cliente"
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
