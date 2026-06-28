import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useDeleteContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      queryClient.removeQueries({ queryKey: ['contactos', id] });
      // Toast is handled at component level
    },
  });
};
