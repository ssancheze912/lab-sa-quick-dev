import { z } from 'zod';
import type { CreateClienteInput } from '../domain/CreateClienteInput';

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(200),
  telefono: z.string().min(1, 'El teléfono es requerido').max(200),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(200),
});

// CreateClienteData satisfies CreateClienteInput — same shape, validated by Zod
export type CreateClienteData = z.infer<typeof createClienteSchema> & CreateClienteInput;
