import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import type { ContactoFormData } from './contactoSchema';

export const useUpdateContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) =>
      contactoApiRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast.success('Contacto actualizado correctamente');
    },
  });
};
