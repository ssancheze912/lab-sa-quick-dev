import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { contactoSchema, type ContactoFormData } from '../application/contactoSchema';
import { useCreateContacto } from '../application/useCreateContacto';

interface ContactoFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultValues?: Partial<ContactoFormData>;
}

export function ContactoForm({ onClose, onSuccess, defaultValues }: ContactoFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues,
  });

  const { mutate, isPending } = useCreateContacto();

  const onSubmit = (data: ContactoFormData) => {
    mutate(data, {
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setError('email', { message: 'El email ya está registrado' });
        } else {
          setError('root', { message: 'Error al crear el contacto. Intente nuevamente.' });
        }
      },
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="contacto-form">
      {errors.root && <span role="alert">{errors.root.message}</span>}
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          {...register('nombre')}
          data-testid="input-nombre"
          aria-describedby="error-nombre"
        />
        <span id="error-nombre" role="alert">
          {errors.nombre?.message}
        </span>
      </div>
      <div>
        <label htmlFor="cargo">Cargo</label>
        <input
          id="cargo"
          {...register('cargo')}
          data-testid="input-cargo"
          aria-describedby="error-cargo"
        />
        <span id="error-cargo" role="alert">
          {errors.cargo?.message}
        </span>
      </div>
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          {...register('telefono')}
          data-testid="input-telefono"
          aria-describedby="error-telefono"
        />
        <span id="error-telefono" role="alert">
          {errors.telefono?.message}
        </span>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          data-testid="input-email"
          aria-describedby="error-email"
        />
        <span id="error-email" role="alert">
          {errors.email?.message}
        </span>
      </div>
      <button type="button" onClick={onClose} data-testid="btn-cancel">
        Cancelar
      </button>
      <button type="submit" disabled={isPending} data-testid="btn-submit">
        {isPending ? 'Creando...' : 'Crear contacto'}
      </button>
    </form>
  );
}
