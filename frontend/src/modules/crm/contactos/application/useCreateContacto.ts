import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import type { ContactoFormData } from './contactoSchema';

export const useCreateContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast.success('Contacto creado correctamente');
    },
  });
};
