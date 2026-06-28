import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { contactoSchema, type ContactoFormData } from '../application/contactoSchema';
import { useCreateContacto } from '../application/useCreateContacto';
import { useUpdateContacto } from '../application/useUpdateContacto';

interface ContactoFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultValues?: Partial<ContactoFormData>;
  contactoId?: string;
}

export function ContactoForm({ onClose, onSuccess, defaultValues, contactoId }: ContactoFormProps) {
  const isEditMode = !!contactoId;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues,
  });

  const createMutation = useCreateContacto();
  const updateMutation = useUpdateContacto();

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const handleError = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      setError('email', { message: 'El email ya está registrado' });
    } else {
      setError('root', {
        message: isEditMode
          ? 'Error al actualizar el contacto. Intente nuevamente.'
          : 'Error al crear el contacto. Intente nuevamente.',
      });
    }
  };

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const onSubmit = (data: ContactoFormData) => {
    if (isEditMode) {
      updateMutation.mutate(
        { id: contactoId!, data },
        { onError: handleError, onSuccess: handleSuccess }
      );
    } else {
      createMutation.mutate(data, { onError: handleError, onSuccess: handleSuccess });
    }
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
        {isPending
          ? isEditMode
            ? 'Guardando...'
            : 'Creando...'
          : isEditMode
            ? 'Guardar cambios'
            : 'Crear contacto'}
      </button>
    </form>
  );
}
