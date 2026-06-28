import { z } from 'zod';

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(255),
  cargo: z.string().trim().min(1, 'El cargo es requerido').max(255),
  telefono: z.string().trim().min(1, 'El teléfono es requerido').max(50),
  email: z.string().trim().email('El email no es válido').min(1, 'El email es requerido').max(255),
});

export type ContactoFormData = z.infer<typeof contactoSchema>;
