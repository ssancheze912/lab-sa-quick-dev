import { z } from 'zod';

export const clienteFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nitRuc: z.string().min(1, 'El NIT/RUC es requerido').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50, 'Máximo 50 caracteres'),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100, 'Máximo 100 caracteres'),
});

// Alias for backward compatibility
export const clienteSchema = clienteFormSchema;

export type ClienteFormValues = z.infer<typeof clienteFormSchema>;
