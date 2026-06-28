import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(255),
  nit: z.string().trim().min(1, 'El NIT/RUC es requerido').max(50),
  telefono: z.string().trim().min(1, 'El teléfono es requerido').max(50),
  ciudad: z.string().trim().min(1, 'La ciudad es requerida').max(100),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
