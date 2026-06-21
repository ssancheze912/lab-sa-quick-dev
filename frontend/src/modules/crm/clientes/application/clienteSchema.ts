import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().min(1, 'El NIT/RUC es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
