import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';

interface ClienteFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClienteForm({ onClose, onSuccess }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClienteFormData>({ resolver: zodResolver(clienteSchema) });

  const { mutate, isPending } = useCreateCliente();

  const onSubmit = (data: ClienteFormData) => {
    mutate(data, {
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' });
        }
      },
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="cliente-form">
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          {...register('nombre')}
          data-testid="input-nombre"
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
        />
        {errors.nombre && <span id="nombre-error" role="alert">{errors.nombre.message}</span>}
      </div>
      <div>
        <label htmlFor="nit">NIT/RUC</label>
        <input
          id="nit"
          {...register('nit')}
          data-testid="input-nit"
          aria-describedby={errors.nit ? 'nit-error' : undefined}
        />
        {errors.nit && <span id="nit-error" role="alert">{errors.nit.message}</span>}
      </div>
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          {...register('telefono')}
          data-testid="input-telefono"
          aria-describedby={errors.telefono ? 'telefono-error' : undefined}
        />
        {errors.telefono && <span id="telefono-error" role="alert">{errors.telefono.message}</span>}
      </div>
      <div>
        <label htmlFor="ciudad">Ciudad</label>
        <input
          id="ciudad"
          {...register('ciudad')}
          data-testid="input-ciudad"
          aria-describedby={errors.ciudad ? 'ciudad-error' : undefined}
        />
        {errors.ciudad && <span id="ciudad-error" role="alert">{errors.ciudad.message}</span>}
      </div>
      <button type="button" onClick={onClose} data-testid="btn-cancel">
        Cancelar
      </button>
      <button type="submit" disabled={isPending} data-testid="btn-submit">
        {isPending ? 'Creando...' : 'Crear cliente'}
      </button>
    </form>
  );
}
